
const URL = require('url')

const bunyan = require('bunyan')
const bformat = require('bunyan-format')  
const formatOut = bformat({ outputMode: 'short' })
const log = bunyan.createLogger({src: true, stream: formatOut, name: "Metrics handler"})

log.info('hand')

export class MetricsHandler {

   metrics(req, resp) {// RUM, APM, 
      //locale

      resp.send('OK')

      let params = req.body
      log.info(params)
         
   }//()
   
   error(req, resp) {

      resp.send('OK')

      let params = req.body
      log.info(params)
         
   }//()
   
   log(req, resp) {

      resp.send('OK')

      let params = req.body
      log.info(params)
         
   }//()

}