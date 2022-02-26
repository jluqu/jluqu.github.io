function rand_index(max) {
    return Math.floor(Math.random()*max)
}

function rand_num(min, max) {
    return Math.floor(Math.random()*(max-min+1))-min+2

}
function choose_rand(list) {
    return list[Math.floor(Math.random()*list.length)]
}
function choose_weighted_rand(map) {
    total = 0
    for (key in map) {
        total += map[key]
    }
    rand = Math.floor(Math.random()*total)
    total = 0
    for (key in map) {
        if (rand < map[key] + total) {
            return key
        }
        total += map[key]
    }
    console.log("Shouldn't get here!")
    return undefined
}

function random_consonant() {
    return choose_weighted_rand({
        'b': 10,
        'c': 10,
        'ch': 10,
        'd': 15,
        'f': 15,
        'g': 10,
        'h': 15,
        'j': 7,
        'k': 8,
        'l': 20,
        'm': 20,
        'n': 17,
        'p': 10,
        'qu': 5,
        'r': 20,
        's': 18,
        'sh': 10,
        't': 18,
        'th': 10,
        'v': 5,
        'w': 7,
        'x': 3,
        'y': 8,
        'z': 3,
    })
}
function random_vowel() {
    return choose_weighted_rand({
        'ao': 3,
        'ai': 6,
        'a': 8,
        'e': 10,
        'ee': 7,
        'ea': 7,
        'ei': 8,
        'i': 10,
        'ia': 5,
        'o': 7,
        'oo': 7,
        'ou': 8,
        'u': 8,
        'ue': 6,
    })
}
function random_sylable(type) {
    if (type === 0) {  // Consonant-vowel
        return random_consonant() + random_vowel()
    } else if (type === 1) { // Vowel-consonent
        return random_vowel() + random_consonant()
    } else if (type === 2) { // Consonent-vowel-consonant
        return random_consonant() + random_vowel() + random_consonant()
    }
}
function gen_place_name() {
    num_sylables = rand_num(1, 3)
    name = ""
    for (i = 0; i < num_sylables; i++) {
        name += random_sylable(rand_index(3))
    }
    // Capitalize the first letter
    name = name[0].toUpperCase() + name.substring(1)
    return name
}
