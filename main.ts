const numberOfHolesForRotation: number = 20

let isOn: boolean = false
let holeCount: number = 0

basic.forever(() => {
    let state: boolean = pins.map(pins.analogReadPin(AnalogPin.P1), 0, 1023, 0, 1) >= 0.5
    if (isOn !== state) {
        isOn = state
        holeCount++
    }
    console.logValue("Pin1 - Raw", pins.map(pins.analogReadPin(AnalogPin.P1), 0, 1023, 0, 1))
    console.logValue("Pin1 - Pure", state ? 1 : 0)
    console.logValue("Pin1 - Count", holeCount)
    console.logValue("Pin1 - Rotation", holeCount / (numberOfHolesForRotation * 2))

    basic.pause(1)
})

input.onLogoEvent(TouchButtonEvent.Pressed, function() {
    holeCount = 0
})

PCAmotor.MotorRun(PCAmotor.Motors.M1, 200)