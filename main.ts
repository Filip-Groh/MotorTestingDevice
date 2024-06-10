const numberOfHolesForRotation: number = 20
const lengthOfRPSQueue: number = 10
const lengthOfMaxRPSQueue: number = 100
const holeErrorCorrection: number = 4

const rpsInMs: number = 100
const motorStepInMs: number = 250
const loggingRateInMs: number = 250

let holeCount: number = 0
let rotation: number = 0
let lastRotation: number = 0
let startSpeed: number = 0

let rpsQueue: Queue = new Queue(lengthOfRPSQueue, [])
let maxRpsQueue: Queue = new Queue(lengthOfMaxRPSQueue, [])

let speed: number = 0

pins.setPull(DigitalPin.P1, PinPullMode.PullNone)
PCAmotor.MotorRun(PCAmotor.Motors.M1, 0)

pins.onPulsed(DigitalPin.P1, PulseValue.High, () => {
    holeCount++
    rotation = holeCount / (numberOfHolesForRotation)
})

loops.everyInterval(rpsInMs, function () {
    let rps = (rotation - lastRotation) * 1000 / rpsInMs
    lastRotation = rotation
    rpsQueue.push(rps)
    if (holeCount < holeErrorCorrection) {
        startSpeed = speed
    }
    if (speed === 255) {
        maxRpsQueue.push(rpsQueue.getAverage())
    }
})

loops.everyInterval(loggingRateInMs, () => {
    console.logValue("Count", holeCount)
    console.logValue("Rotation", rotation)
    console.logValue("RPS", rpsQueue.getAverage())
    console.logValue("Max RPS", maxRpsQueue.getAverage())
    console.logValue("Measurement %", maxRpsQueue.getLength() / lengthOfMaxRPSQueue * 100)
    console.logValue("Speed", speed)
    console.logValue("Starting Speed", startSpeed)
})

input.onLogoEvent(TouchButtonEvent.Pressed, function() {
    holeCount = 0
    rotation = 0
    lastRotation = 0
    speed = 0
    startSpeed = 0
    rpsQueue = new Queue(lengthOfRPSQueue, [])
    maxRpsQueue = new Queue(lengthOfMaxRPSQueue, [])
})

loops.everyInterval(motorStepInMs, () => {
    PCAmotor.MotorRun(PCAmotor.Motors.M1, speed)
    speed++
    speed = Math.clamp(0, 255, speed)
})