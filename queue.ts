class Queue {
    private data: Array<number> = []
    private length: number = 0

    constructor(length: number, inicialData: Array<number> = []) {
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
}