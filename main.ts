const numberOfHolesForRotation: number = 20
const lengthOfRPSQueue: number = 10
const lengthOfAverageMaxRPSQueue: number = 100
const holeErrorCorrection: number = 2
const measurementOvershootCoeficient: number = 2
const maxNumberOfTests: number = 5

const loggingIntoUSB: boolean = true

const sensorPin: DigitalPin = DigitalPin.P1
const motorPin: PCAmotor.Motors = PCAmotor.Motors.M1

const rpsInMs: number = 100
const motorStepInMs: number = 250
const displayRateInMs: number = 1000

type Test = {
    startSpeed: number,
    maxRPS: number,
    unlinearity: number,
    unstability: number,
    time: number
}

enum RenderScreen {
    Menu,
    Graph,
    Data,
    Progress,
    Result
}

let holeCount: number = 0
let rotation: number = 0
let lastRotation: number = 0
let startSpeed: number = 0

let rpsQueue: Queue = new Queue(lengthOfRPSQueue, [])
let averageMaxRpsQueue: Queue = new Queue(lengthOfAverageMaxRPSQueue, [])
let linearityList: List = new List([])
let graphQueue: Queue = new Queue(128, [])
let tests: Array<Test> = []

let speed: number = 0
let isStepping: boolean = false
let maxRpsCount: number = 0

let renderScreen: RenderScreen = RenderScreen.Menu
let choosenNumberOfTests: number = 1
let viewedTest: number = 0

let toRenderNewGraph: boolean = true
let graphPoint: number = 0
let newPoints: number = 0

let timeFromTestStart: number = 0

let display: Display = new Display()
display.drawMode = DrawMode.Overwrite
display.clear()

pins.setPull(sensorPin, PinPullMode.PullNone)
PCAmotor.MotorRun(motorPin, 0)

function startTest(): void {
    holeCount = 0
    rotation = 0
    lastRotation = 0
    speed = 0
    startSpeed = 0
    rpsQueue = new Queue(lengthOfRPSQueue, [])
    averageMaxRpsQueue = new Queue(lengthOfAverageMaxRPSQueue, [])
    graphQueue = new Queue(128, [])
    graphPoint = 0
    newPoints = 0
    maxRpsCount = 0
    linearityList = new List([])
    isStepping = true
    timeFromTestStart = control.millis()
    PCAmotor.MotorRun(motorPin, 0)
    display.clear()
}

function stopTest(): Test {
    PCAmotor.MotorRun(motorPin, 0)
    isStepping = false
    return {
        startSpeed: startSpeed,
        maxRPS: averageMaxRpsQueue.getAverage(),
        unlinearity: linearityList.getFirstPointLastPointLinearity() * rpsInMs / 1000,
        unstability: averageMaxRpsQueue.getLinearity(0, averageMaxRpsQueue.getAverage()) * rpsInMs / 1000,
        time: control.millis() - timeFromTestStart
    }
}

function logTest(): void {
    if (!loggingIntoUSB) {
        return
    }
    console.logValue("Holes", holeCount)
    console.logValue("Rotation", rotation)
    console.logValue("Speed", speed)
    console.logValue("Starting Speed", startSpeed)
    console.logValue("RPS", rpsQueue.getAverage())
    console.logValue("Average Max RPS", averageMaxRpsQueue.getAverage())
    console.logValue("Unlinearity", linearityList.getFirstPointLastPointLinearity() * rpsInMs / 1000)
    console.logValue("Unstability", averageMaxRpsQueue.getLinearity(0, averageMaxRpsQueue.getAverage()) * rpsInMs / 1000)
    console.logValue("Acceleration Measurement %", speed / 255 * 100)
    console.logValue("Max Speed Measurement %", maxRpsCount / (lengthOfAverageMaxRPSQueue * measurementOvershootCoeficient) * 100)
    console.logValue("Tests %", tests.length / choosenNumberOfTests * 100)
    console.logValue("Test (s)", (control.millis() - timeFromTestStart) / 1000)
}

function getAverageOfTests(tests: Array<Test>): Test {
    let sumTest: Test = {
        maxRPS: 0,
        startSpeed: 0,
        unlinearity: 0,
        unstability: 0,
        time: 0
    }
    tests.forEach((value: Test, index: number): void => {
        sumTest.startSpeed += value.startSpeed
        sumTest.maxRPS += value.maxRPS
        sumTest.unlinearity += value.unlinearity
        sumTest.unstability += value.unstability
        sumTest.time += value.time
    })
    return {
        maxRPS: sumTest.maxRPS / tests.length,
        startSpeed: sumTest.startSpeed / tests.length,
        unlinearity: sumTest.unlinearity / tests.length,
        unstability: sumTest.unstability / tests.length,
        time: sumTest.time / tests.length
    }
}

function writeTextInCenter(page: number, text: string): void {
    display.writeString(128 / 2 - text.length * 6 / 2 + 4, page, text)
}

function renderMenu(): void {
    writeTextInCenter(1, "Motor Tester")
    writeTextInCenter(4, "Number of tests:")
    writeTextInCenter(5, choosenNumberOfTests.toString())
    writeTextInCenter(7, "Author: Filip Groh")
}

function renderGraph(): void {
    if (toRenderNewGraph) {
        display.clear()
        graphQueue.getData().forEach((y: number, index: number): void => {
            display.drawPoint(4 + ((graphPoint + index + 1) % 128), Math.clamp(0, 63, 63 - y * 6.4))
        })
    }
    let data: Array<number> = graphQueue.getData()

    for (let i: number = 0; i < newPoints; i++) {
        display.clearVLine(4 + ((graphPoint + i) % 128))
        display.drawPoint(4 + ((graphPoint + i) % 128), Math.clamp(0, 63, 63 - data[data.length - newPoints - 1 + i] * 6.4))
    }

    toRenderNewGraph = false
    graphPoint += newPoints
    graphPoint %= 128
    newPoints = 0
}

function renderData(): void {
    let averageMaxRps: number = averageMaxRpsQueue.getAverage()
    display.writeString(10, 0, `Speed: ${speed}`)
    display.writeString(10, 1, `Starting Speed: ${startSpeed}`)
    display.writeString(10, 2, `RPS: ${Math.roundWithPrecision(rpsQueue.getAverage(), 2)}`)
    display.writeString(10, 3, `Average Max RPS: ${averageMaxRps > 10 ? Math.roundWithPrecision(averageMaxRps, 0) : Math.roundWithPrecision(averageMaxRps, 1)}`)
    display.writeString(10, 4, `Unlinearity: ${Math.roundWithPrecision(linearityList.getFirstPointLastPointLinearity() * rpsInMs / 1000, 0)}`)
    display.writeString(10, 5, `Unstability: ${Math.roundWithPrecision(averageMaxRpsQueue.getLinearity(0, averageMaxRpsQueue.getAverage()) * rpsInMs / 1000, 0)}`)
    display.writeString(10, 6, `Acceleration %: ${Math.roundWithPrecision(speed / 255 * 100, 0)}`)
    display.writeString(10, 7, `Max Speed %: ${Math.roundWithPrecision(maxRpsCount / (lengthOfAverageMaxRPSQueue * measurementOvershootCoeficient) * 100, 0)}`)
}

function renderProgres(): void {
    writeTextInCenter(3, "Tests: ")
    writeTextInCenter(4, `${tests.length + 1}/${choosenNumberOfTests}`)
    if (isStepping) {
        writeTextInCenter(6, `${Math.roundWithPrecision((control.millis() - timeFromTestStart) / 1000, 2)} s`)
    } else {
        writeTextInCenter(6, `${Math.roundWithPrecision((tests[tests.length - 1].time - timeFromTestStart) / 1000, 2)} s`)
    }
}

function renderResult(): void {
    writeTextInCenter(0, "Finished!")
    if (viewedTest === -1) {
        let averageTest: Test = getAverageOfTests(tests)
        writeTextInCenter(1, `Average/${choosenNumberOfTests}`)
        writeTextInCenter(2, `${Math.roundWithPrecision(averageTest.time / 1000, 2)} s`)
        display.writeString(10, 4, `Starting Speed: ${Math.roundWithPrecision(averageTest.startSpeed, 2)}`)
        display.writeString(10, 5, `Max RPS: ${Math.roundWithPrecision(averageTest.maxRPS, 2)}`)
        display.writeString(10, 6, `Unlinearity: ${Math.roundWithPrecision(averageTest.unlinearity, 0)}`)
        display.writeString(10, 7, `Unstability: ${Math.roundWithPrecision(averageTest.unstability, 0)}`)
    } else {
        writeTextInCenter(1, `${viewedTest + 1}/${choosenNumberOfTests}`)
        writeTextInCenter(2, `${Math.roundWithPrecision(tests[viewedTest].time / 1000, 2)} s`)
        display.writeString(10, 4, `Starting Speed: ${Math.roundWithPrecision(tests[viewedTest].startSpeed, 2)}`)
        display.writeString(10, 5, `Max RPS: ${Math.roundWithPrecision(tests[viewedTest].maxRPS, 2)}`)
        display.writeString(10, 6, `Unlinearity: ${Math.roundWithPrecision(tests[viewedTest].unlinearity, 0)}`)
        display.writeString(10, 7, `Unstability: ${Math.roundWithPrecision(tests[viewedTest].unstability, 0)}`)
    }
}

function render(): void {
    switch (renderScreen) {
        case RenderScreen.Menu:
            renderMenu()
            break
        case RenderScreen.Graph:
            renderGraph()
            break
        case RenderScreen.Data:
            renderData()
            break
        case RenderScreen.Progress:
            renderProgres()
            break
        case RenderScreen.Result:
            renderResult()
            break
    }
}

function changeRenderScreen(targetScreen: RenderScreen): void {
    display.clear()
    renderScreen = targetScreen
    toRenderNewGraph = true
    render()
}

function changeNumberOfTests(relativeChange: number): void {
    choosenNumberOfTests += relativeChange
    choosenNumberOfTests = Math.clamp(1, maxNumberOfTests, choosenNumberOfTests)
    render()
}

function changeViewedTest(relativeChange: number): void {
    viewedTest += relativeChange
    viewedTest = viewedTest < -1 ? tests.length - 1: viewedTest
    viewedTest = viewedTest > tests.length - 1 ? -1 : viewedTest
    display.clear()
    render()
}

loops.everyInterval(displayRateInMs, () => {
    render()
    logTest()
})

loops.everyInterval(motorStepInMs, () => {
    if (!isStepping) {
        return
    }
    PCAmotor.MotorRun(motorPin, speed)
    speed++
    speed = Math.clamp(0, 255, speed)
    graphQueue.push(rpsQueue.getAverage())
    newPoints++
})

loops.everyInterval(rpsInMs, function () {
    if (!isStepping) {
        return
    }
    let rps: number = (rotation - lastRotation) * 1000 / rpsInMs
    lastRotation = rotation
    rpsQueue.push(rps)
    if (holeCount < holeErrorCorrection) {
        startSpeed = speed
    }
    if (speed === 255) {
        averageMaxRpsQueue.push(rpsQueue.getAverage())
        maxRpsCount++
    }
    if (maxRpsCount <= 1 && holeCount >= holeErrorCorrection) {
        linearityList.push(rpsQueue.getAverage())
    }
    if (speed === 255 && maxRpsCount === lengthOfAverageMaxRPSQueue * measurementOvershootCoeficient) {
        tests.push(stopTest())
        if (tests.length < choosenNumberOfTests) {
            let lastRenderScreen: RenderScreen = renderScreen
            changeRenderScreen(RenderScreen.Progress)
            basic.pause(5000)
            startTest()
            changeRenderScreen(lastRenderScreen)
        } else {
            viewedTest = -1
            changeRenderScreen(RenderScreen.Result)
        }
    }
})

pins.onPulsed(sensorPin, PulseValue.High, () => {
    holeCount++
    rotation = holeCount / (numberOfHolesForRotation)
})

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    switch (renderScreen) {
        case RenderScreen.Menu:
            tests = []
            startTest()
            changeRenderScreen(RenderScreen.Data)
            break
        case RenderScreen.Graph:
            stopTest()
            changeRenderScreen(RenderScreen.Menu)
            break
        case RenderScreen.Data:
            stopTest()
            changeRenderScreen(RenderScreen.Menu)
            break
        case RenderScreen.Progress:
            stopTest()
            changeRenderScreen(RenderScreen.Menu)
            break
        case RenderScreen.Result:
            changeRenderScreen(RenderScreen.Menu)
            break
    }
})

input.onButtonPressed(Button.A, () => {
    switch (renderScreen) {
        case RenderScreen.Menu:
            changeNumberOfTests(-1)
            break
        case RenderScreen.Graph:
            changeRenderScreen(RenderScreen.Progress)
            break
        case RenderScreen.Data:
            changeRenderScreen(RenderScreen.Graph)
            break
        case RenderScreen.Progress:
            changeRenderScreen(RenderScreen.Data)
            break
        case RenderScreen.Result:
            changeViewedTest(-1)
            break
    }
})

input.onButtonPressed(Button.B, () => {
    switch (renderScreen) {
        case RenderScreen.Menu:
            changeNumberOfTests(1)
            break
        case RenderScreen.Graph:
            changeRenderScreen(RenderScreen.Data)
            break
        case RenderScreen.Data:
            changeRenderScreen(RenderScreen.Progress)
            break
        case RenderScreen.Progress:
            changeRenderScreen(RenderScreen.Graph)
            break
        case RenderScreen.Result:
            changeViewedTest(1)
            break
    }
})