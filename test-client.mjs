import smpp from 'smpp'

console.log('Connecting to SMPP server...')

const session = smpp.connect({
  url: 'smpp://localhost:2775',
  auto_enquire_link_period: 10000,
})

session.on('connect', () => {
  console.log('Connected. Binding...')
  session.bind_transceiver({
    system_id: 'Telvoice',
    password: 'hLjCj%$X$Uv!ZIgZ'
  }, (pdu) => {
    if (pdu.command_status === 0) {
      console.log('Successfully bound to server!')

      // Send a test message
      console.log('Sending test message...')
      session.submit_sm({
        destination_addr: '56927311028', // Un numero de Chile (Entel/Movistar/Claro)
        source_addr: 'TELVOICE',
        short_message: 'Hello! This is a test message from the new SMPP client.'
      }, (pdu) => {
        if (pdu.command_status === 0) {
          console.log(`Message submitted successfully. Message ID: ${pdu.message_id}`)
        } else {
          console.log(`Submit failed with status: ${pdu.command_status}`)
        }

        setTimeout(() => {
          session.unbind()
        }, 2000)
      })
    } else {
      console.error('Bind failed with status:', pdu.command_status)
      session.close()
    }
  })
})

session.on('unbind', () => {
  console.log('Unbound from server.')
  session.close()
})

session.on('error', (err) => {
  console.error('Session error:', err)
})
