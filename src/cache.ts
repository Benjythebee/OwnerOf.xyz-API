let KEY = 'Cache-Control'
let STALE = `stale-if-error=600` // 10 minute grace period for server to come back online

var t = {
  ms: 1,
  second: 1000,
  minute: 60000,
  hour: 3600000,
  day: 3600000 * 24,
  week: 3600000 * 24 * 7,
  month: 3600000 * 24 * 30,
}

function parseDuration(duration: any) {
  let defaultDuration = 3600000

  if (typeof duration === 'number') return duration

  if (typeof duration === 'string') {
    var split = duration.match(/^([\d\.,]+)\s?(\w+)$/)

    if (split!.length === 3) {
      var len = parseFloat(split![1])
      var unit = split![2].replace(/s$/i, '').toLowerCase()
      if (unit === 'm') {
        unit = 'ms'
      }

      return (len || 1) * ((t as any)[unit] || 0)
    }
  }

  return defaultDuration
}

export function defaultCache(req: any, res: any, next: any) {
  // here you can define period in second, this one is one hour
  const period = 3600

  // you only want to cache for GET requests
  if (process.env.NODE_ENV === 'production' && req.method == 'GET') {
    res.set(KEY, `public,max-age=${period},${STALE}`)
  } else {
    // for the other requests set strict no caching parameters
    res.set(KEY, `no-cache,no-store,must-revalidate`)
  }

  // remember to call next() to pass on the request
  next()
}

export function noCache(res: any) {
  res.set(KEY, 'no-cache,no-store,must-revalidate')
}

export default function cache(duration: any) {
  if (duration === 'immutable') {
    return function (req: any, res: any, next: any) {
      res.set(KEY, 'public,max-age=31536000,immutable')
      next()
    }
  }

  if (!duration) {
    return function (req: any, res: any, next: any) {
      res.set(KEY, 'no-cache,no-store,must-revalidate')
      next()
    }
  }

  let dur = parseDuration(duration)

  return function (req: any, res: any, next: any) {
    res.set(KEY, `public,max-age=${(dur / 1000).toFixed(0)},${STALE}`)
    next()
  }
}
