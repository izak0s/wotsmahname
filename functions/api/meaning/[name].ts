/**
 * Get the given substring position
 *
 * @param text
 * @param sub
 * @param index
 */
function getPosition(text: string, sub: string, index: number): number {
    return text.split(sub, index).join(sub).length;
}

export async function onRequestGet({params}) {
    const URL = `https://www.betekenisnamen.nl/naam/${params.name}`;

    // Obtain from data source
    const res = await fetch(URL);
    const data = await res.text();

    const start = getPosition(data, "&quot;", 1);
    const end = getPosition(data, "&quot;", 2);

    // No meaning found
    if (start === 0 || start === end) {
        return Response.json({
            message: `Geen betekenis voor ${params.name} gevonden`
        }, {status: 404})
    }

    // Respond meaning
    return Response.json({
        "meaning": data.substring(start + 6, end),
        "url": URL
    });
}
