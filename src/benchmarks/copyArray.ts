export function preAllocatedWhile(sourceArray: any[]): any[] {
    let i = sourceArray.length;
    const destArray: any[] = new Array(i);
    while (i--) {
        destArray[i] = sourceArray[i];
    }
    return destArray;
}

export function forEachLambda(sourceArray: any[]): any[] {
    const destArray: any[] = new Array(length);
    sourceArray.forEach((value, index) => {
        destArray[index] = value;
    });
    return destArray;
}

export function spreadOperator(sourceArray: any[]): any[] {
    return [...sourceArray];
}
