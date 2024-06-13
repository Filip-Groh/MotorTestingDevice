class Queue extends List {
    private length: number = 0

    constructor(length: number, inicialData: Array<number>) {
        super(inicialData)
        this.length = length
    }

    push(item: number): number {
        this.data.push(item)
        if(this.data.length > this.length) {
            return this.data.shift()
        }
        return null
    }
}