#!/usr/bin/env node

/**
 * 测试生产环境的登录 API
 */

async function testLogin() {
  const url = 'https://tangjiaoyu.top/api/auth/login'
  const email = 'admin@tangjiaoyu.top'
  const password = 'Admin123456'

  console.log('测试登录 API...')
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

    if (response.ok) {
      console.log('\n✅ 登录成功！')
    } else {
      console.log('\n❌ 登录失败')
      console.log('错误信息:', data.error || data.message)
    }

  } catch (error) {
    console.error('请求失败:', error.message)
  }
}

testLogin()
