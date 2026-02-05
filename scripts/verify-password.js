#!/usr/bin/env node

/**
 * 验证密码是否正确
 */

import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wardrobe'
const TEST_PASSWORD = 'Admin123456'

async function verifyPassword() {
  let client

  try {
    console.log('正在连接到 MongoDB...')
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✓ 连接成功\n')

    const db = client.db()
    const users = await db.collection('users').find({}).toArray()

    if (users.length === 0) {
      console.log('❌ 数据库中没有用户')
      return
    }

    const user = users[0]
    console.log('找到用户:')
    console.log(`  邮箱: ${user.email}`)
    console.log(`  姓名: ${user.name}\n`)

    console.log(`测试密码: "${TEST_PASSWORD}"`)
    console.log(`密码哈希: ${user.passwordHash}\n`)

    const isValid = await bcrypt.compare(TEST_PASSWORD, user.passwordHash)

    if (isValid) {
      console.log('✅ 密码验证成功！密码正确。')
    } else {
      console.log('❌ 密码验证失败！密码不匹配。')
      console.log('\n让我尝试其他常见密码...')

      const testPasswords = [
        'Admin123456',
        'admin123456',
        'Admin12345',
        'admin@123',
      ]

      for (const pwd of testPasswords) {
        const valid = await bcrypt.compare(pwd, user.passwordHash)
        if (valid) {
          console.log(`✅ 找到正确密码: "${pwd}"`)
          break
        }
      }
    }

  } catch (error) {
    console.error('错误:', error.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

verifyPassword()
