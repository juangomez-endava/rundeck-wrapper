const fs = require("fs")
const path = require("path")
const Result = require('./result')
const { last, takeLast } = require('./utils')

const dataPath = path.join(__dirname,"/data.json")
const ceroState = {
    "history" : [],
    "latest": {
        "run": {
            "console": "",
            "api": ""
        },
        "read": {
            "id": ""
        },
        "php": {
            "api": ""
        }
    }
}

const readDataFile = () => {
    try{
        const raw = fs.readFileSync(dataPath)
        return Result.Ok(JSON.parse(raw))
    }catch(e){
        return Result.Err(e.message)
    }
}

const saveDataFile = (data) => {
    try {
        fs.writeFileSync(dataPath,JSON.stringify(data))
        return Result.Ok(data)
    } catch(e) {
        return Result.Err(e.message)
    }
}

const createBaseFile = () => saveDataFile(ceroState)

const isRead = arr => arr.length === 2
const mapLatest = data => (arg,index,cmd) => {
    if( arg === "latest" ){
        if(isRead(cmd)){
            return data.latest.read.id
        } else {
            if( index === 1 ){
                return data.latest.run.console
            }else{
                return data.latest.run.api
            }
        }
    }
    return arg
}

const saveCommand = (cmd) => {
    readDataFile()
    .catch(() => Result.Ok(ceroState))
    .map( data => {
        const command = cmd.split(" ").map(mapLatest(data)).join(" ")
        let newHistory = []
        if( last(data.history) === cmd ){
            newHistory = data.history
        } else {
            newHistory = [...takeLast(20,data.history), command]
        }
        return {
            ...data,
            history: newHistory,
        }
    })
    .map(saveDataFile)
}

const saveLatestRun = (id,console,api) => {
    readDataFile()
    .catch(() => Result.Ok(ceroState))
    .map( data => {
        return {
            ...data,
            latest: {
                run: {
                    console,
                    api
                },
                read: {
                    id,
                }
            }
        }
    }).chain(saveDataFile)
}

const saveLatestRead = (id) => {
    readDataFile()
    .catch(() => Result.Ok(ceroState))
    .map(data => {
        return {
            ...data,
            latest: {
                ...data.latest,
                read: {
                    id,
                }
            }
        }
    }).chain(saveDataFile)
}

const saveLatestPhp = (api) => {
    readDataFile()
    .catch(() => Result.Ok(ceroState))
    .map(data => {
        return {
            ...data,
            latest: {
                ...data.latest,
                php: {
                    api,
                }
            }
        }
    }).chain(saveDataFile)
}

module.exports = {
    ceroState,
    readDataFile,
    saveDataFile,
    createBaseFile,
    saveCommand,
    saveLatestRun,
    saveLatestRead,
    saveLatestPhp
}
