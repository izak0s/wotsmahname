/**
 * Manager die alle rendertjes weet
 */
class RenderManager {
    constructor() {
        this.init();
    }

    init() {
        this._renderInstances = [
            new HelloRender(),
            new GenderRender(),
            new StatsRender(),
            new MeaningRender(),
            new NationalityRender(),
            new TryAgainButton()
        ];
    }

    /**
     * Selected name
     * @param name
     */
    render(name) {
        this._renderInstances.forEach(instance => instance.shoot(name));
    }

}

/**
 * Abstract class met render essentials
 */
class Render {
    data() {
        return [];
    }

    /**
     * Maak een Base element aan voor structuur
     * @returns {HTMLDivElement}
     */
    buildBase() {
        this.element = document.createElement("div");
        let data = document.getElementById("data").appendChild(this.element);

        return this.element;
    }

    /**
     * Functie om de render te starten!
     * @param name
     */
    shoot(name) {
        let data = {name: name};
        this.buildBase();

        if (this.data().filter(dependency => !GrisManager.getInstance().hasData(dependency)).length > 0) {
            this.append(this.fallback(data));
            return;
        }

        this.data().forEach((dependency) => {
            data[dependency] = GrisManager.getInstance().getData(dependency);
        });

        return this.append(this.render(data));
    }

    /**
     * Append helper (also allow arrays)
     * @param data
     */
    append(data) {
        if (Array.isArray(data)) {
            data.forEach(item => this.element.appendChild(item));
        } else {
            this.element.appendChild(data);
        }
    }

    /**
     * Render als alle dependencies succesvol zijn geladen
     * @param data -> name + dependencies
     */
    render(data) {
        throw new Error("No render implemented");
    }

    /**
     * Mocht de data onbeschikbaar zijn, dan kan je een fallback krijgen
     * @param data
     */
    fallback(data) {
        throw new Error("No fallback found :(");
    }
}

/**
 * Static utility class
 */
class ElementHelper {
    static bold(text) {
        let el = this.span(text);
        el.classList.add("bold");

        return el;
    }

    static p() {
        return this._createElement("p");
    }

    static span(text) {
        let el = this._createElement("span");
        el.innerText = text;

        return el;
    }

    static a(url, text, bold = false) {
        let el = this._createElement("a");
        el.href = url;
        el.target = "_blank";
        el.innerText = text;
        if (bold)
            el.classList.add("bold");
        return el;
    }

    static header(weight) {
        return this._createElement("h" + weight);
    }

    static _createElement(tag) {
        return document.createElement(tag);
    }
}

/**
 * Render een groot in de taal van je nationaliteit
 */
class HelloRender extends Render {
    data() {
        return ['GroetjesGrisser'];
    }

    render(data) {
        return this.renderHi(data['GroetjesGrisser']["hello"], data.name);
    }

    fallback(data) {
        return this.renderHi("Hi", data.name);
    }

    renderHi(greeting, name) {
        let header = ElementHelper.header(2);
        // Dit was nodig voor Chinese begroetingen, ik weet dat je tegen innerHTML bent voor de veiligheid
        header.innerHTML = `${greeting} `;
        header.appendChild(ElementHelper.bold(name + ", "));

        return header;
    }
}

/**
 * Render de gender
 */
class GenderRender extends Render {
    data() {
        return ['GenderGrisser'];
    }

    render(data) {
        let genderData = data['GenderGrisser'];

        let p = ElementHelper.p();
        p.appendChild(ElementHelper.bold(`${parseFloat((genderData.probability * 100).toFixed(4))}% `));
        p.appendChild(ElementHelper.span("kans dat je een "));
        p.appendChild(ElementHelper.bold(`${this.getGender(genderData.gender)} `));
        p.appendChild(ElementHelper.span("bent (of iets er tussenin natuurlijk)."));

        return p;
    }

    getGender(gender) {
        switch (gender) {
            case "male":
                return "man";
            case "female":
                return "vrouw";
            default:
                return gender;
        }
    }


    fallback(data) {
        let el = ElementHelper.p();
        el.innerText = "Ik kon je geslacht niet ophalen. Maar goed, geslacht is ook weer zo verleden tijd.";
        return el;
    }
}

/**
 * Render de stats van 2014 (Nederlandse voornamenbank)
 */
class StatsRender extends Render {
    data() {
        return ['AnalyseGrisser'];
    }

    render(data) {
        let grissen = data['AnalyseGrisser'];
        let calculated = this.calculate(grissen);
        let p = ElementHelper.p();

        p.append(ElementHelper.span("In "),
            ElementHelper.bold("2014 "),
            ElementHelper.span("waren er "),
            ElementHelper.bold(`${calculated.amount} `),
            ElementHelper.span(`anderen in Nederland met jouw naam. Dat is `),
            ElementHelper.bold(`${parseFloat(calculated.percentage.toFixed(6))}%. `));

        if (calculated.percentage >= 0.1) {
            p.appendChild(ElementHelper.span(`Jouw ouders waren ook niet echt creatief noch origineel, zeg!`));
        } else {
            p.appendChild(ElementHelper.span(`Jouw ouders waren echt origineel!`));
        }

        return p;
    }

    fallback(data) {
        let el = ElementHelper.p();

        el.appendChild(ElementHelper.span("Ik kon geen stats ophalen over jouw naam uit de "));
        el.appendChild(ElementHelper.a("https://www.meertens.knaw.nl/nvb/naam/is/" + data.name, "Nederlandse Voornamenbank", true));

        return el;
    }

    calculate(data) {
        let female = data["firstName"]["FEMALE"];
        let male = data["firstName"]["MALE"];
        let femaleSecond = data["secondName"]["FEMALE"];
        let maleSecond = data["secondName"]["MALE"];

        let amount = female.amount + male.amount + femaleSecond.amount + maleSecond.amount;
        let percentage = female.percentage + male.percentage + femaleSecond.percentage + maleSecond.percentage;

        return {amount: amount, percentage: percentage};
    }
}

/**
 * Render de betekenis van je naam
 */
class MeaningRender extends Render {
    data() {
        return ['MeaningGrisser']
    }

    render(data) {
        let el = ElementHelper.p();
        el.appendChild(ElementHelper.span("Je naam betekent "));
        el.appendChild(ElementHelper.bold(data["MeaningGrisser"]["meaning"]));
        el.appendChild(ElementHelper.span(", hoe vet is dat?"));

        return el;
    }

    fallback(data) {
        let el = ElementHelper.p();
        el.appendChild(ElementHelper.span("Mijn database bevat geen betekenis voor jouw naam! :( Misschien kan je het vinden in een "));
        el.appendChild(ElementHelper.a("https://www.behindthename.com/", "Internationale Database", true));

        return el;
    }
}

/**
 * Render de vlaggen
 */
class NationalityRender extends Render {
    data() {
        return ["NationalizeGrisser"];
    }

    render(data) {
        let countries = data["NationalizeGrisser"]["country"];

        let title = ElementHelper.header(3);
        title.innerText = "Voorspelde nationaliteit";
        let el = ElementHelper._createElement("section");
        el.classList.add("flags");

        countries.forEach(country => {
            // Skip empty country codes?
            if (country.country_id === "")
                return;

            let article = ElementHelper._createElement("article");
            article.classList.add("flag");
            let img = new Image(64, 64);
            img.src = `https://www.countryflags.io/${country.country_id}/flat/64.png`;

            let header = ElementHelper.header(4);

            let countryName = country.country_id;
            if (countryDatabase !== undefined && countryName in countryDatabase) {
                countryName = countryDatabase[countryName];
            }

            header.innerText = countryName;

            let p = ElementHelper.p();
            p.innerText = parseFloat((country.probability * 100).toFixed(4)) + "%";

            article.append(img, header, p);
            el.appendChild(article);
        });

        return [title, el];
    }

    fallback(data) {
        return ElementHelper._createElement("div");
    }
}

/**
 * Dataloos knoppie, maar wel handig om opnieuw te gaan
 */
class TryAgainButton extends Render {
    render(data) {
        let el = document.createElement("div");
        el.classList.add("try_again");

        let button = document.createElement("button");
        button.id = "try_again";
        button.innerText = "Probeer iemand anders";

        el.appendChild(button);

        return el;
    }
}