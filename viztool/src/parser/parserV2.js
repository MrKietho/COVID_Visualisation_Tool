/*
Things that are now being deleted:
- Attributes with fewer than min_amount_entries entries
- Entries that have a z-score higher than zscore_threshold or lower than -1 * zscore_threshold

The parser will also scan through all numerical features and delete any entries that are not numerical
*/

//The range of integers that a categorical attribute may have
var start_range_categorical = 0;
var end_range_categorical = 50;

var sample_threshold = 0.4; //How big the samples must be for the checks (fraction of size of original data)
var number_id_threshold = 10; //How many entries it must look at to decide if an attribute is a number or not
var numerical_id_threshold = 28; //number of entries the parser must look at before deciding if the attribute is numerical or not
var min_amount_entries = 2; //Minimal amount of entries an attribute must have
var zscore_threshold = 3; //Threshold for which outliers should be discarded


/**
 * The main function which takes as input the data parsed into json.
 * And it returns and object that contains all the data that is necessary
 * for the visualisations.
 * 
 * @param {any} data
 */
export function processData(data) {
    let og_data = data;
    let headers = getHeaders(og_data[0]);
    let samples = getSamples(og_data, headers);

    //Attributes that should be deleted
    let attr_to_be_deleted = [];
    //Attributes that should have numbers as entries
    let number_attributes = [];
    //Attributes that are not categorical and contain numbers
    let numerical_attributes = [];
    //Categorical attributes
    let categorical_attributes = [];
    //The key of data which uniquely defines each line
    let data_key = "";
    //array with json objects for the selection bar
    let numericals_for_selectbar = [];
    //Json object with every categorical attribute plus it's range of entries
    let categoricals_possible_values = {};

    attr_to_be_deleted = get_insufficient_attributes(headers, samples);
    number_attributes = get_number_attributes(headers, samples, attr_to_be_deleted);

    //Make sure that all numerical attributes contain only numerical values
    let filtered_data = filter_numbers(og_data, number_attributes);
    //Get a new sample now that the numerical attributes are correct
    let new_sample = getSamples(filtered_data, headers);
    //Delete all attributes that contain near to none information
    filtered_data = filter_data_useless_attributes(filtered_data, attr_to_be_deleted);

    //THESE ARE THE ONLY IMPORTANT VARIABLES
    numerical_attributes = get_numerical_attributes(headers, new_sample, number_attributes, attr_to_be_deleted);
    categorical_attributes = get_categorical_attributes(headers, numerical_attributes, attr_to_be_deleted);
    data_key = headers[0];

    let final_data = filterNumericalsZscore(filtered_data, numerical_attributes);

    //Transform the attributes such that they can be used directly in the visualisations
    numericals_for_selectbar = getSelectBarItemsNumerical(final_data, numerical_attributes);
    categoricals_possible_values = getCategoricalPossibleValues(final_data, categorical_attributes);

    //Create object to easy pass on the important data
    let data_properties = {};
    data_properties["numAttributes"] = numericals_for_selectbar;
    data_properties["catAttributes"] = categoricals_possible_values;
    data_properties["data"] = final_data;

    return data_properties;
}

/**
 * This function creates and returns a header object based on any input row
 * 
 * @param {any} row The row that the header will be based upon
 */
function getHeaders(row) {
    let headers = [];
    for (const attribute in row) {
        headers.push(attribute);
    }
    return headers;
}

/**
 * Get a number of samples of each attribute
 * 
 * @param {any} data The data from which samples should be taken
 * @param {any} headers The attributes where items will need to be selected from
 */
function getSamples(data, headers) {
    let samples = [];
    for (const attribute in headers) {
        samples.push([]);
    }
    for (let i = 0; i < data.length; i++) {
        var row = data[i];
        for (const attribute in row) {
            var index = headers.indexOf(attribute);
            if (row[attribute] == null || samples[index].length > sample_threshold * data.length) {
                continue;
            } else {
                samples[index].push(row[attribute]);
            }
        }
    }
    return samples;
}

/**
 * Filter through all attributes that should contain numbers and delete entries that are not numbers
 * 
 * @param {any} data
 * @param {any} num_attributes The names of the attributes that should contain numbers
 */
function filter_numbers(data, num_attributes) {
    let filtered_data = data;
    for (let i = 0; i < filtered_data.length; i++) {
        for (let j = 0; j < num_attributes.length; j++) {
            var attribute = num_attributes[j];
            var entry = filtered_data[i][attribute];
            if (typeof entry != 'number' && entry != null) {
                filtered_data[i][attribute] = null;
            } 
        }
    }
    return filtered_data;
}

/**
 * Filter out and collect the numerical attributes
 * 
 * @param {any} headers
 * @param {any} sample The entries upon which decision is based
 * @param {any} number_array The names of the attributes that contain numbers
 * @param {any} attr_to_be_deleted The attributes that are already going to be deleted
 */
function get_numerical_attributes(headers, sample, number_array, attr_to_be_deleted) {
    let numericals = []
    let range_categorical = []
    for (let i = start_range_categorical; i <= end_range_categorical; i++) {range_categorical.push(i)}

    for (let i = 0; i < number_array.length; i++) {
        let attribute = number_array[i];
        let index = headers.indexOf(attribute);
        let sureNumerical = false;
        if(sample[index].length < numerical_id_threshold) {
            sureNumerical = true;
        }
        let categorical_counter = 0;
        for (let j = 0; j < numerical_id_threshold; j++) {
            if(sureNumerical) {
                break;
            }
            let entry = sample[index][j];
            if (typeof entry != 'number') {
                break;
            }
            if (entry % 1 !== 0) {
                sureNumerical = true;
            }
            if (range_categorical.includes(entry)) {
                categorical_counter++;
            }
        }
        if (categorical_counter < numerical_id_threshold / 2 && !attr_to_be_deleted.includes(attribute)) {
            numericals.push(attribute);
        } else if (sureNumerical) {
            numericals.push(attribute);
        }
    }
    return numericals;
}

/**
 * Get a collection of all categorical attributes
 * 
 * @param {any} headers All headers
 * @param {any} numericals The numerical attributes
 * @param {any} attr_to_be_deleted The attributes that are already being deleted
 */
function get_categorical_attributes(headers, numericals, attr_to_be_deleted) {
    let categoricals = [];
    for (let i = 1; i < headers.length; i++) {
        let attribute = headers[i];
        if (!numericals.includes(attribute) && !attr_to_be_deleted.includes(attribute)) {
            categoricals.push(attribute);
        }
    }
    return categoricals;
}

/**
 * Get the attributes that do not have enough entries
 * 
 * @param {any} headers All headers
 * @param {any} samples The samples upon which the decision to delete an attribute is based
 */
function get_insufficient_attributes (headers, samples) {
    let attr_to_be_deleted = []
    for (let i = 0; i < headers.length; i++) {
        let attribute = headers[i];
        let index = headers.indexOf(attribute);       
        if (samples[index].length < min_amount_entries) {
            attr_to_be_deleted.push(attribute);
        }
    }
    return attr_to_be_deleted;
}

/**
 * Get the attributes that should have numbers as entries
 * 
 * @param {any} headers All headers
 * @param {any} samples The samples upon which the decsion to detect a number attribute is based
 * @param {any} attr_to_be_deleted The attributes that already will be deleted
 */
function get_number_attributes(headers, samples, attr_to_be_deleted) {
    let number_attributes = []
    for (let j = 0; j < headers.length; j++) {
        let attribute = headers[j];
        let index = headers.indexOf(attribute);
        let num_counter = 0;
        for (let i = 0; i < samples[index].length; i++) {
            if (typeof samples[index][i] == 'number') {
                num_counter++;
            }
        }
        if (num_counter > number_id_threshold / 2 && !attr_to_be_deleted.includes(attribute)) {
            number_attributes.push(attribute);
        } else if (num_counter >= 2) {
            number_attributes.push(attribute);
        }
    }
    return number_attributes;
}

/**
 * Delete all entries of the attributes that should be deleted
 * 
 * @param {any} data All data
 * @param {any} attributes The attributes that should be checked
 */
function filter_data_useless_attributes(data, attributes) {
    let filtered_data = data;
    for (let i = 0; i < data.length; i++) {
        let row = data[i];
        for (let attribute in row) {
            if (attributes.includes(attribute)) {
                delete data[i][attribute];
            }
        }
    }
    return filtered_data;
}

/**
 * Delete all entries that fall outside of the z-score range (and computing the z-score itself)
 * 
 * @param {any} data All data
 * @param {any} numericals The names of all numerical attributes
 */
function filterNumericalsZscore(data, numericals) {
    let final_data = data;
    for (let i = 0; i < numericals.length; i++) {
        let attribute = numericals[i];
        let attribute_data = [];
        for (let j = 0; j < data.length; j++) {
            let row = data[j];
            if (row[attribute] != null) {
                attribute_data.push(row[attribute]);
            }
        }
        let total = 0;
        for (let j = 0; j < attribute_data.length; j++) {
            total += attribute_data[j];
        }
        let mean = total / attribute_data.length;
        let total2 = 0;
        for (let j = 0; j < attribute_data.length; j++) {
            total2 += (attribute_data[j] - mean) ** 2;
        }
        let SD = Math.sqrt((total2 / attribute_data.length));
        for (let j = 0; j < data.length; j++) {
            let entry = data[j][attribute];
            let z_score = (entry - mean) / SD;
            if (entry != null && (z_score < -1 * zscore_threshold || z_score > zscore_threshold)) {
                //console.log(attribute + "   this entry is an outlier:  " + entry);
                data[j][attribute] = null;
            }
        }
    }
    return final_data;
}

/**
 * Get object that can directly be used by visualisations of numerical attributes
 * 
 * @param {any} filteredData All data that should be checked
 * @param {any} numericals The names of all numerical attributes
 */
function getSelectBarItemsNumerical(filteredData, numericals) {
    let select_bar_items = []
    let data = filteredData;
    for (let i = 0; i < numericals.length; i++) {
        let attribute = numericals[i];
        let current_min = 100000;
        let current_max = -100000;
        for (let j = 0; j < data.length; j++) {
            let entry = data[j][attribute];
            if (entry < current_min) {
                current_min = entry;
            }
            if (entry > current_max) {
                current_max = entry;
            }

        }
        let json_object = {}
        json_object["attr"] = attribute;
        json_object["min"] = Math.floor(current_min);
        json_object["max"] = Math.ceil(current_max);
        let slider_json = {}
        slider_json["min"] = Math.floor(current_min);
        slider_json["max"] = Math.ceil(current_max);
        json_object["slider"] = slider_json

        select_bar_items.push(json_object);
    }
    return select_bar_items;
}

/**
 * Get object that can directly be used by visualisations of categorical attributes
 * 
 * @param {any} filteredData All data
 * @param {any} categoricals The names of the categorical attributes
 */
function getCategoricalPossibleValues(filteredData, categoricals) {
    let jsonCategorical = {};
    let data = filteredData;
    for (let i = 0; i < categoricals.length; i++) {
        let attribute = categoricals[i];
        let possible_values = [];
        for (let j = 0; j < data.length; j++) {
            let entry = data[j][attribute];
            if ((!possible_values.includes(entry)) && entry != null) {
                possible_values.push(entry);
            }
        }
        jsonCategorical[attribute] = possible_values;
    }
    return jsonCategorical;
}
