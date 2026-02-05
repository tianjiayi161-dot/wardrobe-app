#!/usr/bin/env node

/**
 * 测试生产环境的登录调试 API
 */

async function testDebugLogin() {
  const url = 'https://tangjiaoyu.top/api/debug/test-login'
  const email = 'admin@tangjiaoyu.top'
  const password = 'Admin123456'

  console.log('测试登录调试 API...')
  console.log(`URL: ${url}`)
  console.log(`邮箱: ${email}`)
  console.log(`密码: ${password}\n`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log(`状态码: ${response.status}`)
    console.log(`状态文本: ${response.statusText}\n`)

    const data = await response.json()
    console.log('响应数据:')
    console.log(JSON.stringify(data, null, 2))

    if (data.success) {
      console.log('\n分析结果:')
      console.log('✅ 用户找到:', data.userEmail)
      console.log('✅ 密码哈希存在:', data.hasHash)
      console.log('✅ 密码哈希前缀:', data.hashPrefix)
      console.log('✅ 密码哈希长度:', data.hashLength)
      console.log(data.passwordValid ? '✅ 密码验证成功' : '❌ 密码验证失败')
      console.log('\n环境变量检查:')
      console.log('JWT_SECRET:', data.envCheck.hasJwtSecret ? `✅ 已设置 (长度: ${data.envCheck.jwtSecretLength})` : '❌ 未设置')
      console.log('MONGODB_URI:', data.envCheck.hasMongoUri ? '✅ 已设置' : '❌ 未设置')
    } else {
      console.log('\n❌ 测试失败')
      console.log('失败步骤:', data.step)
      console.log('错误信息:', data.error)
    }

  } catch (error) {
    console.error('请求失败:', error.message)
  }
}

testDebugLogin()
