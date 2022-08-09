class GrisManager {
    /**
     * Maak de data toegankelijk vanaf elke plek
     *
     * @returns {GrisManager}
     */
    static getInstance() {
        if (GrisManager._instance === undefined)
            GrisManager._instance = new GrisManager();
        return GrisManager._instance;
    }

    init() {
        // Initialize/empty fields
        this.handlers = [];
        this._data = {};
        this._name = "";

        /**
         * Registreer de databronnen
         */
        this.register(new GenderGrisser())
            .register(new NationalizeGrisser())
            .register(new GroetjesGrisser())
            .register(new AnalyseGrisser())
            .register(new MeaningGrisser());

        /**
         * Sla de count op om te weten of we klaar zijn
         * @type {number}
         */
        this.handlerCount = Object.keys(this.handlers).length;

        return this;
    }

    /**
     * Start to get data from a name
     * @param name
     * @param callback
     */
    start(name, callback) {
        this.init();

        // Make sure the name is without any accents (important for the external databases)
        this._name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        this._callback = callback;

        // Let's gris!
        this.shoot();
    }

    /**
     * Gris all data & let the dependencies wait for the required data
     */
    shoot() {
        for (let [key, handler] of Object.entries(this.handlers)) {
            // Skip if a dependency has to get data first
            let dependencies = handler.dependsOn().filter(claz => !(claz in this._data));
            if (dependencies.length > 0) {
                console.log(`Skipping ${key} because it depends on ${dependencies}`);
                continue;
            }

            // If the dependency fails, let this handler also fail
            let failedDependencies = handler.dependsOn().filter(dependency => !this._data[dependency].success);
            if (failedDependencies.length > 0) {
                delete this.handlers[key];

                this.error(key, `Dependency ${failedDependencies.toString()} failed to get the data`);
                continue;
            }

            // Start the data grisser
            handler.get()
                .then(data => this.callback(key, data))
                .catch(reason => this.error(key, reason));

            console.log("Started grisser for " + key);
            // Delete the handler to prevent duplicates
            delete this.handlers[key];
        }
    }

    /**
     * Positive callback for data, everything turned out correctly!
     * @param type
     * @param data
     */
    callback(type, data) {
        console.log("Got data from " + type);
        this._data[type] = {success: true, data: data};
        this.check();
    }

    /**
     * Something went wrong while trying to get the data :(
     * @param type
     * @param data
     */
    error(type, data) {
        console.log("Got error from " + type, data);
        this._data[type] = {success: false, data: data};
        this.check();
    }

    /**
     * Check if all dependencies tried to get the data
     * @returns {*}
     */
    check() {
        if (this.handlerCount === Object.keys(this._data).length) {
            console.log("Gegriste data: ", this._data);

            // Tell the core that it's done!
            return this._callback();
        }

        if (Object.keys(this.handlers).length === 0)
            return;

        console.log("Checking for dependencies");
        this.shoot();
    }

    get name() {
        return this._name;
    }

    hasData(type) {
        return type in this._data && this._data[type].success;
    }

    getData(type) {
        return this._data[type]["data"];
    }

    register(instance) {
        this.handlers[instance.constructor.name] = instance;

        return this;
    }
}

/**
 * Abstract class om dingen te grissen
 */
class GrisHandler {
    url() {
        throw new Error("URL not implemented");
    }

    get() {
        return fetch(`${this.url()}${this.buildArgument()}`)
            .then(response => response.json())
            .then(this.validate);
    }

    validate(data) {
        return data;
    }

    dependsOn() {
        return [];
    }

    buildArgument() {
        return GrisManager.getInstance().name;
    }
}

/**
 * Hallo in je eigen taal is natuurlijk altijd leuk
 */
class GroetjesGrisser extends GrisHandler {
    constructor() {
        super();
    }

    url() {
        return "https://fourtonfish.com/hellosalut/?cc=";
    }

    validate(data) {
        if (data.code === "none" || data.hello === "") {
            throw new Error("No country or greeting found");
        }

        return data;
    }

    buildArgument() {
        let data = GrisManager.getInstance().getData("NationalizeGrisser");
        // THIS CANNOT BE NULL
        return data["country"][0]["country_id"];
    }

    dependsOn() {
        return ["NationalizeGrisser"];
    }
}

/**
 * Data wat de betekenis van de naam is
 */
class MeaningGrisser extends GrisHandler {
    constructor() {
        super();
    }

    url() {
        return "./api/meaning/";
    }

    validate(data) {
        if (data.meaning === undefined || data.meaning === null)
            throw new Error("No meaning found! Wel belangrijk man.");
        return data;
    }
}

/**
 * Data hoeveel Nederlanders er waren met jouw naam
 */
class AnalyseGrisser extends GrisHandler {
    constructor() {
        super();
    }

    url() {
        return "https://hva.izak.amsterdam/wotsmahname/api/grisStats?name=";
    }

    validate(data) {
        if (data.firstName === undefined || data.secondName === null)
            throw new Error("No stats found! Wel belangrijk man.");
        return data;
    }
}

/**
 * Schatting van je geslacht
 */
class GenderGrisser extends GrisHandler {
    constructor() {
        super();
    }

    url() {
        return "https://api.genderize.io?name=";
    }

    validate(data) {
        if (data.gender === undefined || data.gender === null)
            throw new Error("No gender found! Man, vrouw of iets er tussenin?");
        return data;
    }
}

/**
 * Waar kom je vandaan?
 */
class NationalizeGrisser extends GrisHandler {
    constructor() {
        super();
    }

    url() {
        return "https://api.nationalize.io?name=";
    }

    validate(data) {
        if (data.country.length === 0) {
            throw new Error("No country found for this name (raw: " + JSON.stringify(data) + ")");
        }
        return data;
    }
}
