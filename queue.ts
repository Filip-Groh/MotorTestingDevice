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

    getAverage(): number {
        let sum: number = 0
        for(let i: number = 0; i < this.data.length; i++) {
            sum += this.data[i]
        }
        return sum / this.data.length
    }

    getLength(): number {
        return this.data.length
    }
}