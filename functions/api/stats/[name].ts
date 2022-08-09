import {parse} from 'node-html-parser';

export async function onRequestGet({params}) {
    const URL = `https://www.meertens.knaw.nl/nvb/naam/is/${params.name}`;
    const res = await fetch(URL);
    const data = await res.text();

    // Early return 404
    if (data.includes("notfound")) {
        return Response.json("Couldn't find any data for this name at knaw :(", {status: 404});
    }

    try {
        return Response.json(parseInput(data, URL));
    } catch (err) {
        return Response.json("Did knaw finally upgrade it's site to 2022, unable to find the structure.", {status: 500});
    }

}

/**
 * Manually parse the input, it's horrible and hacky, but it was a side project at university,
 * so won't rewrite it (:
 *
 * @param page
 * @param url
 */
function parseInput(page: string, url: string): object {
    const parsed = parse(page);

    const tds = parsed.querySelectorAll("td");
    let current = "";
    let firstName = true;
    let next = "";
    let passedAmount = false;
    let skipUntilNewType = false;
    let result = {firstName: {"MALE": {}, "FEMALE": {}}, secondName: {"MALE": {}, "FEMALE": {}}, url: url};

    tds.forEach((td) => {
        // Track header
        if (td.classList.contains("header")) {
            if (td.text === "m") {
                current = "MALE";
                passedAmount = false;
                return;
            } else if (td.text === "v") {
                current = "FEMALE";
                passedAmount = false;
                return;
            }
        }

        // No male or female specified
        if (current === "") {
            throw new Error("Site format changed :(");
        }

        // Check first name
        if (td.text === "als eerste naam:") {
            firstName = true;
            return;
        }

        if (td.text === "als volgnaam:") {
            firstName = false;
            passedAmount = false;
            return;
        }

        // Track data type
        if (td.classList.contains("smallcolumn")) {
            if (passedAmount)
                next = "percentage";
            else {
                next = "amount";
            }
            return;
        }

        if (next !== "") {
            if (td.text === "" || skipUntilNewType || td.classList.length !== 0)
                return;

            // @ts-ignore
            let data = td.text.replaceAll("%", "");
            if (data === "--") {
                data = 0;
            }

            // Convert to int
            data = parseFloat(data);

            const key = firstName ? "firstName" : "secondName";
            result[key][current][next] = data;

            if (next === "amount")
                passedAmount = true;
            next = "";
        }
    });

    return result;
}

