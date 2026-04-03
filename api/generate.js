const https = require(‘https’)

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’)
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’)
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’)

if (req.method === ‘OPTIONS’) return res.status(200).end()
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ })

const { mode, answers } = req.body
if (!mode || !answers) return res.status(400).json({ error: ‘Missing fields’ })

const isPersonal = mode === ‘personal’
const det = answers.details || {}
const today = new Date().toLocaleDateString(‘en-GB’, { day: ‘numeric’, month: ‘long’, year: ‘numeric’ })

const systemPrompt = isPersonal
? `You are a specialist in UK statutory law. Write assertive, legally-grounded letters for members of the public challenging public bodies. Always cite exact statute section numbers (e.g. s.508B(6) Education Act 1996, s.149 Equality Act 2010, Care Act 2014, NHS Complaints Regulations 2009). Always include a 14-day response deadline and name the appropriate escalation route (Local Government and Social Care Ombudsman, Parliamentary and Health Service Ombudsman, or Judicial Review). Format as a complete formal letter. Today's date: ${today}.`
: `You are a specialist in UK public sector statutory compliance. Write professional, legally-compliant communications for public sector organisations. Always cite exact statute section numbers. Clearly state recipient rights including right to appeal, complain, or request review. Format as a complete formal letter. Today's date: ${today}.`

const userMessage = isPersonal
? `Generate a formal statutory challenge letter:\nOrganisation type: ${answers.org_type}\nIssue: ${answers.issue}\nPrevious contact: ${answers.previous_contact}\nDesired outcome: ${answers.desired_outcome}\nSender: ${det.your_name || '[Name]'}\nOrganisation: ${det.org_name || '[Organisation]'}\nReference: ${det.reference || 'N/A'}\nIssue began: ${det.date_of_issue || 'Not specified'}\n\nCite specific statute sections. Be authoritative and precise.`
: `Generate a formal statutory communication:\nOur organisation: ${answers.org_type}\nCommunication type: ${answers.comm_type}\nStatutory frameworks: ${answers.framework}\nContext: ${answers.context}\nOur name: ${det.org_name || '[Organisation]'}\nRecipient: ${det.recipient || '[Recipient]'}\nReference: ${det.reference || 'N/A'}\nTone: ${det.tone || 'Professional and formal'}`

const body = JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 1500,
system: systemPrompt,
messages: [{ role: ‘user’, content: userMessage }]
})

try {
const letter = await new Promise((resolve, reject) => {
const options = {
hostname: ‘api.anthropic.com’,
path: ‘/v1/messages’,
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: process.env.ANTHROPIC_API_KEY,
‘anthropic-version’: ‘2023-06-01’,
‘Content-Length’: Buffer.byteLength(body)
}
}

```
  const request = https.request(options, (response) => {
    let data = ''
    response.on('data', chunk => data += chunk)
    response.on('end', () => {
      try {
        const parsed = JSON.parse(data)
        const text = parsed.content?.find(b => b.type === 'text')?.text
        if (text) resolve(text)
        else reject(new Error('No content: ' + JSON.stringify(parsed)))
      } catch (e) {
        reject(new Error('Parse error: ' + data))
      }
    })
  })

  request.on('error', reject)
  request.write(body)
  request.end()
})

return res.status(200).json({ letter })
```

} catch (e) {
console.error(‘Error:’, e.message)
return res.status(500).json({ error: ’Generation failed: ’ + e.message })
}
}
