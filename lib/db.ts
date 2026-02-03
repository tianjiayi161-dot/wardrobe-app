import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('请在.env.local中配置MONGODB_URI环境变量')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  // 在开发环境中使用全局变量，避免热重载时创建多个连接
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // 在生产环境中使用新的客户端
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

// 获取数据库实例
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db('wardrobe')
}

// 获取集合
export async function getCollection(collectionName: string) {
  const db = await getDatabase()
  return db.collection(collectionName)
}
