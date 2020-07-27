const { spawn } = require("child_process")
const Maybe = require("./maybe")
const Result = require("./result")
const { syncWritable } = require("./streams")

const {
    readDataFile, createBaseFile, saveCommand,
    saveLatestRun, saveLatestRead, saveLatestPhp,
    ceroState
} = require('./file')

const {
    apply, split, last, trim, prop,
    log, maybeProp, defaultTo
} = require('./utils')

const getArg = defaultTo("latest")

const getBranches = (cons,api="latest") => {
    let consBranch = cons;
    let apiBranch = api;
    if( cons === "latest" || api === "latest"){
        const data = readDataFile()
        .onError(() => ceroState)
        consBranch = cons === "latest" ? data.latest.run.console : cons
        apiBranch = api === "latest" ? data.latest.run.api : api
    }
    return [consBranch,apiBranch]
            .map(Maybe.fromFalsy)
            .some(x => x.isNone()) ? 
                Result.Err("Must supply both branches")
                : Result.Ok([ consBranch, apiBranch ])
}

const getApiBranch = (api="latest") => {
    if( api === "latest" ){
        api = readDataFile().onError(() => ceroState).latest.php.api;
    }
    return Maybe.fromFalsy(api)
        .map(Result.Ok)
        .onNone(Result.Err("Must supply api branch"))
}

const getId = (id="latest") => {
    let runId = id
    if( id === "latest" ){
        runId = readDataFile()
        .catch(() => Result.Ok(ceroState))
        .map(x => x.latest.read.id)
        .map(trim)
        .get()
    }
    return Result.fromFalsy(runId,"No run id supplied")
}

const ops = {
    run:   (consoleBranch, apiBranch) => ({ 
        name: "run", 
        args: [consoleBranch, apiBranch],
        unsafeRun(){
            saveCommand(`run ${getArg(consoleBranch)} ${getArg(apiBranch)}`)
            getBranches(consoleBranch,apiBranch)
            .map( ([cons, api]) => {
                const proc = spawn("built-cli",["intern", cons, api])
                proc.stdout.on("data", data => {
                    process.stdout.write(data)
                    Maybe
                    .fromFalsy(data.toString())
                    .map(split("/"))
                    .map(last)
                    .map(trim)
                    .map((id) => saveLatestRun(id,cons,api))
                })
                proc.stderr.on("data", data => {
                    console.error(data.toString())
                })
                proc.on("close", code => {
                    console.log(`exited with status code ${code}`)
                    process.exit(code)
                })
            }).onError(console.error)
        }
    }),
    read:  (id) => ({ 
        name: "read", 
        args: [id], 
        unsafeRun(){
            saveCommand(`read ${getArg(id)}`)
            getId(id).map(
                id => {
                    saveLatestRead(id)
                    const proc = spawn("built-cli",["rundeck", id],{ stdio: [ 'inherit', 'pipe', 'inherit' ]})
                    proc.stdout.pipe(syncWritable((chunk,encoding) => {
                        data = chunk.toString();
                        if( data.includes("Intern job started successfully") ){
                            Maybe
                            .fromFalsy(data.toString())
                            .map(split("/"))
                            .map(last)
                            .map(trim)
                            .map(saveLatestRead)
                        }
                    }))
                    proc.stdout.pipe(process.stdout)
                    proc.once("exit",(code) => {
                        console.log(`program exited with code ${code}`)
                        process.exit(code)
                    })
                }
            ).onError(console.error)
        }
    }),
    php: (branch) => ({
        name: "php",
        args: [branch],
        unsafeRun(){
            saveCommand(`php ${getArg(branch)}`)
            getApiBranch(branch)
            .map( id => {
                saveLatestPhp(id)
                const proc = spawn("built-cli",["php", id],{ stdio: [ 'inherit', 'pipe', 'inherit' ]})
                proc.stdout.pipe(process.stdout)
                proc.once("exit",(code) => {
                    console.log(`program exited with code ${code}`)
                    process.exit(code)
                })
            }).onError(console.error)
        }
    }),
    history: (...args) => ({
        name: "history",
        args,
        unsafeRun(){
            readDataFile()
            .map(prop("history"))
            .map(history => {
                if(history.length === 0){
                    console.log("No commands have been used since last wipe")
                } else {
                    history.forEach((x,index) => console.log(index,x))
                }
            })
            .onError(() => {
                createBaseFile()
                return []
            })
        }
    }),
    check: (...args) => ({
        name: "check",
        args,
        unsafeRun(){
            readDataFile()
            .map(console.log)
            .catch(e => {
                console.log("No data file found. Creating...")
                createBaseFile()
                console.log(ceroState)
            })
        }
    }),
    clear: () => ({
        name: "clear",
        args: [],
        unsafeRun(){
            createBaseFile()
            .map(() => console.log("Cleared history"))
            .onError((e) => console.error("Unkown error \n",e))
        }
    }),
    help: (...args) => ({
        name: "help",
        args,
        unsafeRun(){
            console.log([
                "Rundeck wrapper v1.0",
                "Allows the use of a extra layer of logic between user and built-cli for running rundeck intern test. Will keep a history of previous commands.",
                "Available commands are",
                "     run <console_branch> <api_branch> : starts a rundeck intern test",
                "     read <rundeck_id>                 : reads the result of intern test",
                "     php <api_branch>                  : runs phpunit tests",
                "     history                           : shows command history",
                "     clear                             : clears history",
                "     help                              : shows what you are seeing",
                "     check                             : prints the config file",
                "",
                "read and run arguments can be replaced with 'latest'. It will attempt to use the last used value for the command. For read, it will attempt to use the id of the result of the last run call",
                "",
                "The command history groups consecutive calls to the same command. Meaning that id you call 'rundeck read' 3 times in a row, history will only contain one call to read. Arguments count as part of the command so 'rundeck read latest' and 'rundeck read 112233' are different. History only stores calls to read and run. Ignores all other commands"
            ].join("\n"))
        }
    })
}

const CommandNotAvailable = (...args) => ({
    name: "Command Not Available",
    args,
    unsafeRun(){
        console.error("Provided command not available. Please use help for list of available commands")
    }
})

const NoCommand = (...args) => ({
    name: "No Command",
    args,
    unsafeRun(){
        console.error("No command provided. Use help for list of available commands")
    }
})

const getCommand = (args) => (name) => {
    return maybeProp(name)(ops)
            .map(apply(args))
            .onNone(() => CommandNotAvailable(...args));
}

const parseArgs = (args) => {
    return Maybe.fromFalsy(args[2])
        .map(getCommand(args.slice(3)))
        .onNone(() => NoCommand(...args))
}

module.exports = {
    parseArgs
}