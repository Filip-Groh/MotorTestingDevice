const numberOfHolesForRotation: number = 20
const lengthOfRPSQueue: number = 10
const lengthOfAverageRPSQueue: number = 100
const holeErrorCorrection: number = 2

const sensorPin: DigitalPin = DigitalPin.P1
const motorPin: PCAmotor.Motors = PCAmotor.Motors.M1

const rpsInMs: number = 100
const motorStepInMs: number = 250
const loggingRateInMs: number = 1000

let holeCount: number = 0
let rotation: number = 0
let lastRotation: number = 0
let startSpeed: number = 0

let rpsQueue: Queue = new Queue(lengthOfRPSQueue, [])
let averageRpsQueue: Queue = new Queue(lengthOfAverageRPSQueue, [])
let linearityList: List = new List([])

let speed: number = 0
let isStepping: boolean = false

let display: Display = new Display()
display.drawMode = DrawMode.Overwrite

pins.setPull(sensorPin, PinPullMode.PullNone)
PCAmotor.MotorRun(motorPin, 0)

display.clear()

loops.everyInterval(loggingRateInMs, () => {
    console.logValue("Holes", holeCount)
    console.logValue("Rotation", rotation)
    console.logValue("Speed", speed)
    console.logValue("Starting Speed", startSpeed)
    console.logValue("RPS", rpsQueue.getAverage())
    console.logValue("Average RPS", averageRpsQueue.getAverage())
    console.logValue("Unlinearity", linearityList.getFirstPointLastPointLinearity())
    console.logValue("Unstability", averageRpsQueue.getLinearity(0, averageRpsQueue.getAverage()))
    console.logValue("Acceleration Measurement %", speed / 255 * 100)
    console.logValue("Max Speed Measurement %", averageRpsQueue.getLength() / lengthOfAverageRPSQueue * 100)


    display.writeString(10, 0, `Speed: ${speed}`)
    display.writeString(10, 1, `Starting Speed: ${startSpeed}`)
    display.writeString(10, 2, `RPS: ${Math.roundWithPrecision(rpsQueue.getAverage(), 2)}`)
    display.writeString(10, 3, `Average RPS: ${Math.roundWithPrecision(averageRpsQueue.getAverage(), 2)}`)
    display.writeString(10, 4, `Unlinearity: ${Math.roundWithPrecision(linearityList.getFirstPointLastPointLinearity(), 0)}`)
    display.writeString(10, 5, `Unstability: ${Math.roundWithPrecision(averageRpsQueue.getLinearity(0, averageRpsQueue.getAverage()), 0)}`)
    display.writeString(10, 6, `Acceleration %: ${Math.roundWithPrecision(speed / 255 * 100, 0)}`)
    display.writeString(10, 7, `Max Speed %: ${Math.roundWithPrecision(averageRpsQueue.getLength() / lengthOfAverageRPSQueue * 100, 0)}`)
})

pins.onPulsed(sensorPin, PulseValue.High, () => {
    holeCount++
    rotation = holeCount / (numberOfHolesForRotation)
})

loops.everyInterval(rpsInMs, function () {
    let rps: number = (rotation - lastRotation) * 1000 / rpsInMs
    lastRotation = rotation
    rpsQueue.push(rps)
    if (holeCount < holeErrorCorrection) {
        startSpeed = speed
    }
    if (speed === 255) {
        averageRpsQueue.push(rpsQueue.getAverage())
    }
    if (averageRpsQueue.getLength() <= 1 && holeCount >= holeErrorCorrection) {
        linearityList.push(rpsQueue.getAverage())
    }
})

input.onLogoEvent(TouchButtonEvent.Pressed, function() {
    holeCount = 0
    rotation = 0
    lastRotation = 0
    speed = 0
    startSpeed = 0
    rpsQueue = new Queue(lengthOfRPSQueue, [])
    averageRpsQueue = new Queue(lengthOfAverageRPSQueue, [])
    linearityList = new List([])
    isStepping = !isStepping
    PCAmotor.MotorRun(motorPin, 0)
    display.clear()
})

loops.everyInterval(motorStepInMs, () => {
    if (!isStepping) {
        return
    }
    PCAmotor.MotorRun(motorPin, speed)
    speed++
    speed = Math.clamp(0, 255, speed)
})