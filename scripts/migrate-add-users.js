#!/usr/bin/env node

/**
 * 数据迁移脚本：添加用户认证支持
 *
 * 此脚本会：
 * 1. 创建管理员用户账号
 * 2. 将所有现有的衣服和搭配归属到管理员账号
 * 3. 创建必要的数据库索引
 *
 * 运行方式：
 * node scripts/migrate-add-users.js
 * 或
 * npm run migrate
 */

import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import readline from 'readline'

// 从环境变量读取 MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wardrobe'

// 创建命令行输入接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Promise 包装的 question 函数
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

// 主函数
async function migrate() {
  console.log('='==='.repeat(60))
  console.log('What2Wear 数据迁移工具')
  console.log('='==='.repeat(60))
  console.log()

  let client

  try {
    // 1. 连接到 MongoDB
    console.log('正在连接到 MongoDB...')
    console.log(`URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`)

    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✓ MongoDB 连接成功\n')

    const db = client.db()
    const usersCollection = db.collection('users')
    const clothesCollection = db.collection('clothes')
    const outfitsCollection = db.collection('outfits')

    // 2. 检查是否已经执行过迁移
    const existingUsers = await usersCollection.countDocuments()
    if (existingUsers > 0) {
      console.log(`警告: 已存在 ${existingUsers} 个用户账号`)
      const confirm = await question('是否继续创建新的管理员账号？(y/N): ')
      if (confirm.toLowerCase() !== 'y') {
        console.log('已取消迁移')
        rl.close()
        await client.close()
        return
      }
    }

    // 3. 获取管理员信息
    console.log('\n请输入管理员账号信息:')
    const adminName = await question('姓名: ')
    const adminEmail = await question('邮箱: ')
    const adminPassword = await question('密码 (至少8个字符，包含大小写字母和数字): ')

    // 验证输入
    if (!adminName || !adminEmail || !adminPassword) {
      throw new Error('所有字段都是必填的')
    }

    if (adminPassword.length < 8) {
      throw new Error('密码至少需要8个字符')
    }

    if (!/[a-z]/.test(adminPassword) || !/[A-Z]/.test(adminPassword) || !/[0-9]/.test(adminPassword)) {
      throw new Error('密码需包含大小写字母和数字')
    }

    // 4. 创建管理员账号
    console.log('\n正在创建管理员账号...')
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const adminUser = {
      email: adminEmail.toLowerCase(),
      passwordHash,
      name: adminName,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,  // 管理员账号默认已验证
    }

    const userResult = await usersCollection.insertOne(adminUser)
    const adminUserId = userResult.insertedId
    console.log(`✓ 管理员账号创建成功`)
    console.log(`  用户ID: ${adminUserId.toString()}`)
    console.log(`  邮箱: ${adminEmail}`)
    console.log(`  姓名: ${adminName}\n`)

    // 5. 统计现有数据
    const clothesCount = await clothesCollection.countDocuments()
    const outfitsCount = await outfitsCollection.countDocuments()

    console.log('现有数据统计:')
    console.log(`  衣服: ${clothesCount} 件`)
    console.log(`  搭配: ${outfitsCount} 套\n`)

    if (clothesCount === 0 && outfitsCount === 0) {
      console.log('没有需要迁移的数据')
    } else {
      // 6. 迁移衣服数据
      if (clothesCount > 0) {
        console.log('正在迁移衣服数据...')
        const clothesResult = await clothesCollection.updateMany(
          { userId: { $exists: false } },  // 只更新没有 userId 的文档
          { $set: { userId: adminUserId } }
        )
        console.log(`✓ 衣服数据迁移完成: ${clothesResult.modifiedCount} 件`)
      }

      // 7. 迁移搭配数据
      if (outfitsCount > 0) {
        console.log('正在迁移搭配数据...')
        const outfitsResult = await outfitsCollection.updateMany(
          { userId: { $exists: false } },  // 只更新没有 userId 的文档
          { $set: { userId: adminUserId } }
        )
        console.log(`✓ 搭配数据迁移完成: ${outfitsResult.modifiedCount} 套\n`)
      }
    }

    // 8. 创建索引
    console.log('正在创建数据库索引...')

    try {
      await clothesCollection.createIndex({ userId: 1 })
      console.log('✓ clothes.userId 索引创建成功')
    } catch (err) {
      console.log('  clothes.userId 索引可能已存在')
    }

    try {
      await outfitsCollection.createIndex({ userId: 1 })
      console.log('✓ outfits.userId 索引创建成功')
    } catch (err) {
      console.log('  outfits.userId 索引可能已存在')
    }

    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true })
      console.log('✓ users.email 唯一索引创建成功')
    } catch (err) {
      console.log('  users.email 索引可能已存在')
    }

    // 9. 验证迁移结果
    console.log('\n正在验证迁移结果...')
    const clothesWithUser = await clothesCollection.countDocuments({ userId: adminUserId })
    const outfitsWithUser = await outfitsCollection.countDocuments({ userId: adminUserId })

    console.log('迁移后数据统计:')
    console.log(`  属于管理员的衣服: ${clothesWithUser} 件`)
    console.log(`  属于管理员的搭配: ${outfitsWithUser} 套`)

    // 10. 完成
    console.log('\n' + '='.repeat(60))
    console.log('✅ 数据迁移完成!')
    console.log('='.repeat(60))
    console.log('\n请使用以下信息登录:')
    console.log(`  邮箱: ${adminEmail}`)
    console.log(`  密码: (你刚才输入的密码)`)
    console.log('\n你可以访问 http://localhost:3000 或你的域名开始使用\n')

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message)
    console.error('\n详细错误:', error)
    process.exit(1)
  } finally {
    rl.close()
    if (client) {
      await client.close()
      console.log('MongoDB 连接已关闭')
    }
  }
}

// 运行迁移
migrate().catch((error) => {
  console.error('未捕获的错误:', error)
  process.exit(1)
})
