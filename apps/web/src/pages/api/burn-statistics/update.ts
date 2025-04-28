import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextApiHandler } from 'next'
import { getBurnHistoryTable } from 'utils/stats/burnHistoryTable'
import { getBurnTimeSeries } from 'utils/stats/burnTimeSeries'
import { getDeflationTimeSeries } from 'utils/stats/deflationTimeSeries'
import { getMintTimeSeries } from 'utils/stats/mintTimeSeries'
import { getTotalSupplyMintBurn } from 'utils/stats/totalSupplyMintBurn'
import { getTotalSupplyTimeSeries } from 'utils/stats/totalSupplyTimeSeries'
import { BurnStats } from 'views/BurnDashboard/types'

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Vercel's cron job automatically adds the Authorization header
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Fetch data from Dune
  try {
    const [
      totalSupplyMintBurn,
      totalSupplyTimeSeries,
      deflationTimeSeries,
      burnTimeSeries,
      mintTimeSeries,
      burnHistoryTable,
    ] = await Promise.all([
      getTotalSupplyMintBurn(),
      getTotalSupplyTimeSeries(),
      getDeflationTimeSeries(),
      getBurnTimeSeries(),
      getMintTimeSeries(),
      getBurnHistoryTable(),
    ])

    const result: Partial<BurnStats> = {
      // Use the earliest timestamp of all data
      timestamp: Math.min(
        totalSupplyMintBurn.timestamp,
        totalSupplyTimeSeries.timestamp,
        deflationTimeSeries.timestamp,
        burnTimeSeries.timestamp,
        mintTimeSeries.timestamp,
        burnHistoryTable.timestamp,
      ),
      ...totalSupplyMintBurn.data,
      totalSupplyTimeSeries: totalSupplyTimeSeries.data,
      deflationTimeSeries: deflationTimeSeries.data,
      burnTimeSeries: burnTimeSeries.data,
      mintTimeSeries: mintTimeSeries.data,
      burnHistoryTable: burnHistoryTable.data,
    }

    // Put data in R2 bucket
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || '',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    })

    const putCommand = new PutObjectCommand({
      Bucket: 'burn-statistics',
      Key: 'data.json',
      Body: JSON.stringify(result),
      ContentType: 'application/json',
    })

    await s3Client.send(putCommand)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: `An error occurred while updating burn statistics ${error}` })
  }
}

export default handler
