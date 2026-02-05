#!/usr/bin/env node

/**
 * 检查数据库中的用户
 */

import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载 .env.local 文件
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// 从环境变量读取 MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wardrobe'

async function checkUsers() {
  let client

  try {
    console.log('正在连接到 MongoDB...')
    console.log(`URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`)

    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✓ MongoDB 连接成功\n')

    const db = client.db()
    const usersCollection = db.collection('users')

    const users = await usersCollection.find({}).toArray()

    console.log(`找到 ${users.length} 个用户:\n`)

    users.forEach((user, index) => {
      console.log(`用户 ${index + 1}:`)
      console.log(`  ID: ${user._id.toString()}`)
      console.log(`  邮箱: ${user.email}`)
      console.log(`  姓名: ${user.name}`)
      console.log(`  已验证: ${user.emailVerified}`)
      console.log(`  创建时间: ${user.createdAt}`)
      console.log(`  有密码哈希: ${!!user.passwordHash}`)
      console.log()
    })

  } catch (error) {
    console.error('错误:', error.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('MongoDB 连接已关闭')
    }
  }
}

checkUsers()
