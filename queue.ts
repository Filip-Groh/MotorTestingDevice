class Queue {
    private data: Array<number> = []
    private length: number = 0

    constructor(length: number, inicialData: Array<number>) {
        this.length = length
        this.data = inicialData
    }

    push(item: number): number {
        this.data.push(item)
        if(this.data.length > this.length) {
            return this.data.shift()
        }
        return null
    }

    getSum(): number {
        let sum: number = 0
        for (let i: number = 0; i < this.data.length; i++) {
            sum += this.data[i]
        }
        return sum
    }

    getLength(): number {
        return this.data.length
    }

    getAverage(): number {
        return this.getSum() / this.data.length
    }

    getLinearity(a: number, b: number): number {
        let sum: number = 0
        for (let i: number = 0; i < this.data.length; i++) {
            sum += Math.abs(this.data[i] - a * i + b)
        }
        return sum
    }

    getFirstPointLastPointLinearity(): number {
        let a: number = (this.data[0] - this.data[this.data.length - 1]) / this.data.length
        let b: number = this.data[0]
        return this.getLinearity(a, b)
    }
}