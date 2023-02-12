export async function onRequestGet({params}) {
    const URL = `https://hellosalut.stefanbohacek.dev/?cc=${params.country}`;

    // Obtain from data source
    const res = await fetch(URL);
    const data = await res.json();

    // Respond meaning
    return Response.json(data);
}
