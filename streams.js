const stream = require("stream")

const Writable = (f) => {
    return new stream.Writable({
        write(chunk,encoding,callback){
            f(chunk,encoding,callback)
        }
    })
}

const syncWritable = (f) => {
    return Writable((chunk,encoding,callback) => {
        f(chunk,encoding)
        callback();
    })
}

module.exports ={ 
    Writable,
    syncWritable
}