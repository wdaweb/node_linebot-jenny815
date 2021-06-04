import linebot from 'linebot'
import dotenv from 'dotenv'
import axios from 'axios'
import schedule from 'node-schedule'

let data = []

const getData = async () => {
  axios
    .get('https://data.taipei/api/getDatasetInfo/downloadResource?id=6bb3304b-4f46-4bb0-8cd1-60c66dcd1cae&rid=98840c0a-1870-4b2e-b995-1e5f0af53b0a')
    .then(response => {
      console.log('成功取得資料')
      data = response.data
    })
    .catch()
}
// 每天0點更新資料
schedule.scheduleJob('* * 0 * *', getData)
// 機器人啟動時也要有資料
getData()

// 讓套件讀取 .env 檔案
// 讀取後可以用 process.env.變數 使用
dotenv.config()
// 計算距離公式
// lat1 點 1 的緯度
// lon1 點 1 的經度
// lat2 點 2 的緯度
// lon2 點 2 的經度
// unit 單位，不傳是英里，K 是公里，N 是海里
const distance = (lat1, lon1, lat2, lon2, unit = 'K') => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0
  } else {
    const radlat1 = (Math.PI * lat1) / 180
    const radlat2 = (Math.PI * lat2) / 180
    const theta = lon1 - lon2
    const radtheta = (Math.PI * theta) / 180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = (dist * 180) / Math.PI
    dist = dist * 60 * 1.1515
    if (unit === 'K') {
      dist = dist * 1.609344
    }
    if (unit === 'N') {
      dist = dist * 0.8684
    }
    return dist
  }
}
//

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.listen('/', process.env.PORT, () => {
  console.log('機器人啟動')
})

bot.on('message', async event => {
  if (event.message.type === 'location') {
    // const result = data.filter(d => {
    //   return d.行政區 === event.message.text
    // })[0]
    // event.reply({
    //   type: 'location',
    //   title: result.行政區,
    //   address: result.地點,
    //   latitude: result.經度,
    //   longitude: result.緯度
    // })
    // console.log(event.message)
    let arr = []
    for (const d of data) {
      const dis = distance(d.緯度, d.經度, event.message.longitude, event.message.latitude)
      if (dis <= 0.5) {
        arr.push({
          type: 'location',
          title: d.行政區,
          address: d.地點,
          latitude: d.經度,
          longitude: d.緯度,
          dis
        })
      }
    }
    arr = arr
      .sort((a, b) => {
        return a.dis - b.dis
      })
      .map(a => {
        delete a.dis
        return a
      })
      .slice(0, 4)
    event.reply(arr)
    console.log(arr)
  }
})
