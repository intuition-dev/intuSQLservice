import { BaseDBL } from 'mbakex/lib/BaseDBL'
import { Geo } from '../gdb/Geo'
import { Utils } from './Utils'

const bunyan = require('bunyan')
const bformat = require('bunyan-format2')  
const formatOut = bformat({ outputMode: 'short' })
const log = bunyan.createLogger({src: true, stream: formatOut, name: "DB"})

const hash = require("murmurhash3js")

export class MeDB extends BaseDBL  {

   static MAXINT:number = 9223372036854775807 
   static _geo:Geo

   constructor() {
      super()
      MeDB._geo = new Geo()

      this.schema()
   }//()

   _getPriorDateTimeDiff(fullFinger, curDate) {
      const rows = this.read(`SELECT dateTime FROM met
         WHERE fullFinger = ?
         ORDER BY dateTime DESC 
         LIMIT 1
         `, fullFinger)
      if((!rows) || rows.length!=1 )
         return MeDB.MAXINT

      const row = rows[0]
      const delta = ( Date.parse(curDate) - row['dateTime']  ) / 1000
      return delta 
   }//()

   async writeMetrics(domain, fullFinger, params, ip) {
      const date = new Date().toISOString()

      // sameDomain
      let referrerLocalFlag:number = 0
      const refHost = Utils.getHostname(params.referrer)
      const curHost = Utils.getHostname(params.referrer)      

      if(curHost==refHost)
         referrerLocalFlag = 1

      let priorDateTimeDiff:number = this._getPriorDateTimeDiff(fullFinger, date)

      log.info(priorDateTimeDiff, params)
      
      // pk is assigned by db in this case
      // priorDateTimeDiff is how long since the last load page event - look for last record. Max for never
      
      this.write(`INSERT INTO met( fullFinger, dateTime, domain,
         url, referrer, domTime, idleTime,
         referrerLocalFlag, priorDateTimeDiff )
            VALUES
         ( ?,?,?,
          ?,?,?,?,
          ?,?
         )`
         ,
         fullFinger, date, domain,
         params.url, params.referrer, params.domTime, params.idleTime,
         referrerLocalFlag, priorDateTimeDiff
      )
   
      // check if fullFinger exists
      if(MeDB._fingeExists(fullFinger, this))
      return

      // dev only: ip = '64.78.253.68'
      const geo:any = await MeDB._geo.get(ip)

      // fullFinger is PK
      this.write(`INSERT INTO device( fullFinger, ip,
         lat, long, cou, sub, post, aso, proxy,
         bro, os, mobile, tz, lang, ie, 
         h, w, dateTime)
            VALUES
      ( ?, ?,
       ?,?,?, ?,?,?,?,
       ?,?,?, ?,?,?,
       ?,?,?
      )`
      ,
      fullFinger, ip, 
      geo.lat, geo.long, geo.cou, geo.sub, geo.post, geo.aso, geo.proxy,
      params.bro, params.os, params.mobile, params.tz, params.lang, params.ie,
      params.h, params.w, date
     )//
      
   }//()
   
   writeError(domain, ip, type, error:string) {
      const date = new Date().toISOString()

      const ehash:string = hash.x64.hash128(error+domain)

      // is error new
      this.write(`INSERT INTO error( domain, dateTime, ip,
         ehash, error, type )
         VALUES
      ( ?, ?, ?,
         ?,?,?
      )`
      ,
         domain, date, ip,
         ehash, error, type
      )//

   }//()
   getErrors(){}//  by domain,  date

   private schema() {

      // SEO
      this.defCon(process.cwd(), '/db/met.db')

      const exists = this.tableExists('met')
      if(exists) return
      log.info('schema')

      this.write(`CREATE TABLE error( domain, dateTime TEXT, ip,
            ehash, error, type 
         ) `)
      this.write(`CREATE INDEX error_ehash ON error(ehash)`)
      this.write(`CREATE INDEX error_desc ON error(domain, dateTime DESC)`)

      this.write(`CREATE TABLE met( fullFinger TEXT, dateTime TEXT, domain,
            url, referrer, domTime, idleTime,
            referrerLocalFlag INTEGER, priorDateTimeDiff INT
         ) `)
      this.write(`CREATE INDEX met_dt ON met (fullFinger, dateTime DESC, domTime, idleTime)`)
         
      this.write(`CREATE TABLE device( fullFinger TEXT NOT NULL PRIMARY KEY, ip TEXT,
            lat, long, cou, sub, post, aso, proxy,
            bro, os, mobile, tz, lang, ie INTEGER, 
            h, w, dateTime TEXT
         ) WITHOUT ROWID `)
      this.write(`CREATE INDEX device_ip ON device(ip, dateTime DESC)`)

    }//()

   static _fingeExists(fullFinger, ctx:BaseDBL) {
      const rows = ctx.read(`SELECT fullFinger FROM device
         WHERE fullFinger = ?
         LIMIT 1
         `, fullFinger)
      if((!rows) || rows.length!=1 )
         return false
      return true
   }//()


   showRecentUsers(domain, cou) {
      const rows = this.read(`SELECT DISTINCT fullFinger FROM met
         ORDER BY dateTime DESC 
         LIMIT 60
         `)
      // for each finger, get metrics and country

   }//()

   showPerf(){ // average performance groped by time and country

   }

   showMap(){}
   showRef(){}
   showRUMPath(){}
   showRPM(){}

}//()