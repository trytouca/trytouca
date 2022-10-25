import logger from './logger'

const envAllowsAutoCopy = () =>
  process.env.NODE_ENV === 'development' && process.env.EMIT_COPIES === '1'

/**
 *  run a callback a given number of times, waiting a random interval between specified min and max after each call.
 * Returned function begins calling callback the first time it is called, and ignores any subsequent calls.
 * @param maxCopies number of times to run callback
 * @param initDelaySeconds how long to wait before calling callback for the first time. Defaults to 5 seconds.
 * @param minDelaySeconds  shortest amount of time that can elapse between all calls AFTER the first. Defaults to 3 seconds.
 * @param maxDelaySeconds greatest amount of time that can elapse between all calls AFTER the first. Defaults to 10 seconds.
 * @returns "start" function
 */
export const createAutoCopier = (
  maxCopies: number,
  initDelaySeconds?: number,
  minDelaySeconds?: number,
  maxDelaySeconds?: number
) => {
  initDelaySeconds = initDelaySeconds ?? 5
  minDelaySeconds = minDelaySeconds ?? 3
  maxDelaySeconds = maxDelaySeconds ?? 10

  //   make sure min/max behavior stays rational
  const delayWindow = Math.abs(maxDelaySeconds - minDelaySeconds)

  let hasRunOnce = false
  let copiesRemaining = maxCopies
  let timerID: ReturnType<typeof setTimeout>

  return (copyFunc: () => void) => {
    if (hasRunOnce) {
      return
    }

    if (!envAllowsAutoCopy()) {
      return
    }

    hasRunOnce = true

    logger.info('beginning copying at random intervals')

    const copyAtRandomInterval = () => {
      timerID = setTimeout(() => {
        if (copiesRemaining <= 0) {
          return
        }

        logger.debug('calling copy function')

        copyFunc()

        copiesRemaining--

        // trigger next copy 3 - 10 seconds from now
        const nextDelaySeconds =
          (Math.floor(Math.random() * delayWindow) + minDelaySeconds) * 1000

        timerID = setTimeout(copyAtRandomInterval, nextDelaySeconds)
      }, initDelaySeconds * 1000)
    }

    copyAtRandomInterval()

    return timerID
  }
}
