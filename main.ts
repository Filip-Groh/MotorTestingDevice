const numberOfHolesForRotation: number = 20
const scanRate: number = 1000
const rpsRate: number = 100

let holeCount: number = 0
let rotation: number = 0
let lastRotation: number = 0
let rps: number = 0

pins.setPull(DigitalPin.P1, PinPullMode.PullNone)

pins.onPulsed(DigitalPin.P1, PulseValue.High, () => {
    holeCount++
    rotation = holeCount / (numberOfHolesForRotation * 2)
})

basic.forever(() => {
    console.logValue("Pin1 - Count", holeCount)
    console.logValue("Pin1 - Rotation", rotation)
    console.logValue("Pin1 - RPS", rps)
    basic.pause(1000 / scanRate)
})

input.onLogoEvent(TouchButtonEvent.Pressed, function() {
    holeCount = 0
})

loops.everyInterval(rpsRate, function() {
    rps = (rotation - lastRotation) * 4
    lastRotation = rotation
})

let speed: number = 0
loops.everyInterval(0.5, () => {
    PCAmotor.MotorRun(PCAmotor.Motors.M1, speed)
    speed++
    speed = Math.clamp(0, 255, speed)
})