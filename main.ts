const numberOfHolesForRotation: number = 20
const rpsRate: number = 100

const motorStepInMs: number = 500
const loggingRateInMs: number = 250

let holeCount: number = 0
let rotation: number = 0
let lastRotation: number = 0
let rps: number = 0

let speed: number = 0

pins.setPull(DigitalPin.P1, PinPullMode.PullNone)

pins.onPulsed(DigitalPin.P1, PulseValue.High, () => {
    holeCount++
    rotation = holeCount / (numberOfHolesForRotation * 2)
})

loops.everyInterval(rpsRate, function () {
    rps = (rotation - lastRotation) * 4
    lastRotation = rotation
})

loops.everyInterval(loggingRateInMs, () => {
    console.logValue("Pin1 - Count", holeCount)
    console.logValue("Pin1 - Rotation", rotation)
    console.logValue("Pin1 - RPS", rps)
})

input.onLogoEvent(TouchButtonEvent.Pressed, function() {
    holeCount = 0
})

loops.everyInterval(motorStepInMs, () => {
    PCAmotor.MotorRun(PCAmotor.Motors.M1, speed)
    speed++
    speed = Math.clamp(0, 255, speed)
})