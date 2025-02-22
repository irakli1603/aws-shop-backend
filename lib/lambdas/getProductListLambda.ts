export const handler = async (event: any) => {

    const mockData = [
        {
            description: "Product with attractive price #1 (Nice)",
            id: "1",
            price: 69,
            title: "Product #1"
        },
        {
            description: "Product with comically large price",
            id: "2",
            price: 420,
            title: "Product #2"
        }
    ]

    return {
        statusCode: 200,
        headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(mockData)
    }
}