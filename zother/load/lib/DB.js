"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bunyan = require('bunyan');
const bformat = require('bunyan-format');
const formatOut = bformat({ outputMode: 'short' });
const log = bunyan.createLogger({ src: true, stream: formatOut, name: "some name" });
const BaseDBL_1 = require("mbakex/lib/BaseDBL");
class DB extends BaseDBL_1.BaseDBL {
    constructor() {
        super();
        this.schema();
    }
    fastCon(path, fn) {
        this._fn = path + fn;
        log.info(this._fn);
        this._db = new BaseDBL_1.BaseDBL.Database(this._fn);
        this._db.pragma('cache_size = 50000');
        log.info(this._db.pragma('cache_size', { simple: true }));
        this._db.pragma('synchronous=OFF');
        this._db.pragma('count_changes=OFF');
        this._db.pragma('journal_mode=MEMORY');
        this._db.pragma('temp_store=MEMORY');
        this._db.pragma('locking_mode=EXCLUSIVE');
        log.info(this._db.pragma('locking_mode', { simple: true }));
        this._db.pragma('automatic_index=false');
    }
    schema() {
        this.fastCon(process.cwd(), '/aa.db');
        const exists = this.tableExists('mon');
        if (exists)
            return;
        log.info('.');
        this.write(`CREATE TABLE mon( guid, shard, 
         host, 
         nicR, nicT,
         memFree, memUsed,
         cpu,            
         dt_stamp TEXT) `);
    }
    ins(params) {
        this.write(`INSERT INTO mon( guid, shard, 
         host, 
         nicR, nicT,
         memFree, memUsed,
         cpu,            
         dt_stamp) 
               VALUES
         ( ?,?,
         ?,?,?,
         ?,?,?,
         ? )`, params.guid, params.ip, params.host, params.nicR, params.nicT, params.memFree, params.memUsed, params.cpu, params.dt_stamp);
    }
    showLastPerSecond(host) {
        const rows = this.read(`SELECT datetime(dt_stamp, 'localtime') as local, * FROM mon
         ORDER BY host, dt_stamp DESC 
         LIMIT 60
         `);
        const sz = rows.length;
        let i;
        const rows2 = {};
        for (i = sz - 1; i >= 0; i--) {
            const row = rows[i];
            let date = new Date(row['local']);
            let seconds = Math.round(date.getTime() / 1000);
            delete row['dt_stamp'];
            delete row['guid'];
            delete row['shard'];
            rows2[seconds] = row;
        }
        return rows2;
    }
    countMon() {
        const row = this.readOne(`SELECT count(*) as count FROM mon `);
        log.info(row);
    }
    memory() {
        const row = this.readOne(`SELECT sqlite3_memory_used()`);
        log.info(row);
    }
}
exports.DB = DB;
