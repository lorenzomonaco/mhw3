const IMG_LOGOS = ['img/site-logos/logo.png', 'img/site-logos/old-logo.png'];
const PROMO_IMG_SRC = 'img/promo-top-section/';
const PROMO_IMG_NUM = 3;

// Per ottenere clientId e clientSecret, registrarsi e andare alla pagina: https://developer.ebay.com/my/keys -> Sezione 'Production'
const clientId = '';
const clientSecret = '';
const scope = 'https://api.ebay.com/oauth/api_scope';
const auth = 'Basic ' + btoa(clientId + ":" + clientSecret);
let accessToken = null;


function changeLogo() {
    const actualLogo = logoImg.getAttribute('src');
    if (actualLogo === IMG_LOGOS[0])
        logoImg.src = IMG_LOGOS[1];
    else if (actualLogo === IMG_LOGOS[1])                      // if non necessario
        logoImg.src = IMG_LOGOS[0];
}

function menuHandler(event) {
    let menu;
    if (event.currentTarget.id === 'category-button') 
        menu = document.querySelector('#category-menu');
    else
        menu = document.querySelector('#my-account-menu');

    if (menu.classList.contains('menu-showed')) {
        // console.log('Chiudo');
        menu.classList.replace('menu-showed', 'menu-hidden');
    } else {
        // console.log('Apro');
        menu.classList.replace('menu-hidden', 'menu-showed');
    }
    event.preventDefault();                                    // Per il menù de "Il mio eBay"
}

function zoomImg(event) {
    if (event.type === 'mouseover')
        event.target.classList.add('zoom-transform');
    else if (event.type === 'mouseout')                        // if non necessario
        event.target.classList.remove('zoom-transform');
}

function createImage(src) {
    const image = document.createElement('img');
    image.src = src;
    image.addEventListener('mouseover', zoomImg);
    image.addEventListener('mouseout', zoomImg);
    return image;
}

function loadPromoTopSection(src, numImgPromo) {
    for (let i = 0; i < containerPromo.length; i++) {
        const containerPromoImg = containerPromo[i].querySelector('.flex-container-img');
        for (let j = 1; j <= numImgPromo; j++) {
            let img = createImage(src + i + '-' + j + '.jpg');
            containerPromoImg.append(img);
        }
        if (containerPromo[i].dataset.show === 'none')
            containerPromo[i].classList.add('hide-container-promo');
    }
}

function changePromoContainer(event) {
    const currentContainer = document.querySelector('[data-show="yes"]');
    const actualIndex = currentContainer.dataset.promoNumber;
    let newIndex;
    if (event.target.id === 'go-back-promo-button') {
        if (actualIndex == 1)
            newIndex = containerPromo.length;
        else
            newIndex = parseInt(actualIndex) - 1;               // parseInt() perchè actualIndex riconosciuto come string
    } else if (event.target.id === 'go-ahead-promo-button') {
        if (actualIndex == containerPromo.length)
            newIndex = 1;
        else
            newIndex = parseInt(actualIndex) + 1;
    }

    currentContainer.classList.replace('show-container-promo', 'hide-container-promo');
    currentContainer.dataset.show = 'none';
    
    const nextContainer = document.querySelector('[data-promo-number="' + newIndex + '"]');
    nextContainer.classList.replace('hide-container-promo', 'show-container-promo');
    nextContainer.dataset.show = 'yes';
}

function showFullTitleCard(event) {
    const titleElement = event.target.querySelector('[data-show-title="yes"]');
    if (titleElement === null) {
        const tooltip = document.createElement('div');
        tooltip.classList.add('tooltip');
        tooltip.textContent = event.target.textContent;
        tooltip.dataset.showTitle = 'yes';
        event.target.appendChild(tooltip);
    } else
        event.target.removeChild(titleElement);   
}


const logoImg = document.querySelector('#logo');
logoImg.addEventListener('click', changeLogo);

const myAccountLink = document.querySelector('#my-account-link');
const categoryButton = document.querySelector('#category-button');
myAccountLink.addEventListener('click', menuHandler);
categoryButton.addEventListener('click', menuHandler);

const sectionPromo = document.querySelector('#promo-top-section');
const containerPromo = document.querySelectorAll('.flex-container-promo-top');
loadPromoTopSection(PROMO_IMG_SRC, PROMO_IMG_NUM);

const goBackPromoButton = document.querySelector('#go-back-promo-button');
const goAheadPromoButton = document.querySelector('#go-ahead-promo-button');
goBackPromoButton.addEventListener('click', changePromoContainer);
goAheadPromoButton.addEventListener('click', changePromoContainer);

const promoArticlesCards = document.querySelectorAll('#promo-cards-section article .flex-item-cell-title h3');
for (let i = 0; i < promoArticlesCards.length; i++) {
    promoArticlesCards[i].addEventListener('mouseover', showFullTitleCard);
    promoArticlesCards[i].addEventListener('mouseout', showFullTitleCard);
}




// ---------- MHW3 ----------

const searchButton = document.querySelector('#cerca-button');
const inputSearch = document.querySelector('#nav-input-search');
const searchContainer = document.querySelector('#search-container');
const categorySelect = document.querySelector('#category-select');
const categoryTabMenu = document.querySelector('#categories-tr-tab-menu');  // category-tab-menu
searchButton.addEventListener('click', searchAPIRequest);
inputSearch.addEventListener('keyup',changeInputSearch);
const categories = new Map();

const NUM_RESULTS = 10;

function urlEncode(str) {
    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function spaceSeparate(str) {
    return str.replace(/(%20)+/g, ' ');
}

function urlEncodeSpaceSeparate(str) {
    return spaceSeparate(urlEncode(str));
}

function onTextResponseOk(response) {
    if(!response.ok) {
        console.log('Error: ' + response.status);
        return null;
    }
    return response.text();
}

function onResponseOk(response) {
    if(!response.ok) {
        console.log('Error: ' + response.status);
        return null;
    }
    return response.json();
}

function onResponseNo(response) {
    console.log('onResponseNo: ' + response);
}

function copySuggText(event) {
    inputSearch.value = event.currentTarget.textContent;
    fetch('https://corsproxy.io/?https://suggestqueries.google.com/complete/search?output=toolbar&hl=it&&ds=sh&q=' + encodeURI(inputSearch.value), {
            method: "GET",
    }).then(onTextResponseOk, onResponseNo).then(onSuggResponse);
}

function decodeHtmlEntities(text) {
    return text.replace(/&#([0-9]{1,3});/gi, (_, entity) =>
        String.fromCharCode(entity)
    );
}

/* ----- OTTENIMENTO SUGGERIMENTI ----- */
function onSuggResponse(response) {
    // console.log(response);
    searchContainer.innerHTML = '';

    const xmlLines = response.split('"');
    let dim = 0;
    for (const line of xmlLines) {
        if (line.startsWith('<') || line.startsWith('/') || line.startsWith('?'))
            continue;
        dim++;
        if (dim == 1)
            continue;   // Per non stampare la versione XML
        const divElement = document.createElement('h2');
        divElement.addEventListener('click', copySuggText);
        divElement.textContent = decodeHtmlEntities(line);
        searchContainer.appendChild(divElement);
    }
    // console.log('Ricavati ' + --dim + ' suggerimenti.');
    if (dim > 0)
        searchContainer.classList.replace('menu-hidden', 'menu-showed');
}

function changeInputSearch() {
    searchContainer.innerHTML = '';
    searchContainer.classList.replace('menu-showed', 'menu-hidden');
    if ((inputSearch.value).length > 2) {
        fetch('https://corsproxy.io/?https://suggestqueries.google.com/complete/search?output=toolbar&hl=it&&ds=sh&q=' + encodeURI(inputSearch.value), {
            method: "GET",
        }).then(onTextResponseOk, onResponseNo).then(onSuggResponse);
    }
}

/* ----- CARICAMENTO CATEGORIE ----- */
function onCategoriesJSON(response) {
    const { rootCategoryNode } = response;
    const { childCategoryTreeNodes } = rootCategoryNode;
    let dim = 0;

    const mainCategories = ['Abbigliamento e accessori','Casa, arredamento e bricolage','Telefonia fissa e mobile','Libri e riviste','TV, audio e video','Giocattoli e modellismo','Sport e viaggi','Informatica','Collezionismo'];
    // const redirectCategories = ['Elettronica','Gaming','Elettrodomestici','Casa e giardino','Fai da te','Collezionismo','Moda','Sport','Motori','Ricondizionato','Aste di beneficenza'];
    mainCategories.sort();
    // const subCategories = new Map();
    let rowCategoryTab = document.createElement('tr');
    let numColums = 0;

    for (const singleChild of childCategoryTreeNodes) {
        const { category } = singleChild;
        
        if (mainCategories.includes(category.categoryName)) {
            const newCategory = category.categoryName;

            const columnCategoryTab = document.createElement('td');
            const mainCategoryH3Column = document.createElement('h3');
            const mainCategoryAColumn = document.createElement('a');
            const subCategoryListColumn = document.createElement('ul');

            mainCategoryAColumn.textContent = newCategory;
            mainCategoryAColumn.href = 'https://www.ebay.it/b/' + encodeURI(newCategory) + '/' + category.categoryId;
            mainCategoryH3Column.appendChild(mainCategoryAColumn);
            columnCategoryTab.appendChild(mainCategoryH3Column);

            // console.log(newCategory + ' trovato. aggiungo le sottocategorie.');
            // let subSonCategories = new Map();
            let k = 0;
            for (let singleSubChild of singleChild.childCategoryTreeNodes) {
                if (k == 4)
                    break;
                let { category } = singleSubChild;
                const subCategoryList = document.createElement('li');
                const subCategoryListA = document.createElement('a');
                subCategoryListA.textContent = category.categoryName;
                subCategoryListA.href = 'https://www.ebay.it/b/' + encodeURI(category.categoryName) + '/' + category.categoryId;
                subCategoryList.appendChild(subCategoryListA);
                subCategoryListColumn.appendChild(subCategoryList);

                // subSonCategories.set(category.categoryName, category.categoryId);
                // console.log('Ho aggiunto ' + category.categoryName);
                k++;
            }

            columnCategoryTab.appendChild(subCategoryListColumn);
            rowCategoryTab.appendChild(columnCategoryTab);
            numColums++;
            if (numColums % 3 == 0) {
                categoryTabMenu.appendChild(rowCategoryTab);
                rowCategoryTab = document.createElement('tr');
            }

            // subCategories.set(newCategory, subSonCategories);
            mainCategories.splice(mainCategories.indexOf(newCategory), 1);
        }
        
        // console.log('categoryId: ' + category.categoryId + ', categoryName: ' + category.categoryName);
        categories.set(category.categoryName, category.categoryId);
        
        dim++;
    }

    // RIFERIMENTO: <a class="scnd" href="Abbigliamento-da-uomo/1059/...">Uomo: Abbigliamento</a>

    // console.log('ho ricevuto ' + dim + ' categorie.');
    // console.log(categories);
    
  
    const sortedCategories = Array.from(categories.keys()).sort();
    const altreCategorie = 'Altre categorie';
    sortedCategories.splice(sortedCategories.indexOf(altreCategorie), 1);
    sortedCategories.push(altreCategorie);
    
    for (let j = 0; j < dim; j++) {
        // console.log('j: ' + j + ', Categoria da piazzare: ' + sortedCategories[j]);
        const option = document.createElement('option');
        option.value = categories.get(sortedCategories[j]);
        // console.log('trovato: ' + option.value);
        option.textContent = sortedCategories[j];
        categorySelect.appendChild(option);
    }
    
    return;
}

function onCategoryTreeJSON(response) {
    const categoryTree = response.categoryTreeId;
    // console.log('categoryTree: ' + categoryTree);

    fetch('https://corsproxy.io/?https://api.ebay.com/commerce/taxonomy/v1/category_tree/' + categoryTree, {
        method: "GET",
        headers: {
            'Accept-Encoding': 'gzip',
            'Authorization': 'Bearer ' + accessToken
        }
    }).then(onResponseOk, onResponseNo).then(onCategoriesJSON);
}

function loadNextPageResults(event) {
    event.preventDefault();

    const targetPage = event.currentTarget.dataset.next;

    fetch('https://corsproxy.io/?' + targetPage, {
        method: "GET",
        headers: {
            'X-EBAY-C-MARKETPLACE-ID':'EBAY_IT',
            'Content-Type': 'application/json',
            'Accept-Language': 'it-IT',
            'Content-Language': 'it-IT',
            'Authorization': 'Bearer ' + accessToken
        }
    }).then(onResponseOk, onResponseNo).then(onSearchResponseJSON);
}

/* ----- CARICAMENTO RISULTATI ----- */
function onSearchResponseJSON(response) {
    
    let nextPageLink = document.querySelector('#next-page-results');
    if (nextPageLink !== null)
        nextPageLink.remove();

    let detailRow = document.createElement('h1');

    if (response === null) {
        console.log('La ricerca ha riscontrato errori.');
        detailRow.textContent = 'Errore nella ricerca.';
        searchContainer.appendChild(detailRow);
        searchContainer.classList.replace('menu-hidden', 'menu-showed');
        return;
    }
    // console.log(response);
    console.log('Ricerca eseguita con successo: trovate ' + response.total + ' inserzioni.');
    
    if (response.total === 0) {
        detailRow.textContent = 'Nessun risultato trovato.';
        searchContainer.appendChild(detailRow);
        searchContainer.classList.replace('menu-hidden', 'menu-showed');
        return;
    } else if (response.warnings !== undefined) {
        detailRow.textContent = 'Nessun risultato trovato nella categoria da te selezionata.';
        searchContainer.appendChild(detailRow);
        searchContainer.classList.replace('menu-hidden', 'menu-showed');
        console.log('Warning: ' + response.warnings);
        return;
    }

    let i = 0;

    const { itemSummaries } = response;
    for (const itemSummary of itemSummaries) {
        const {title, price, shippingOptions, condition, image, itemWebUrl, itemLocation} = itemSummary;
        
        const rowLink = document.createElement('a');

        i++;
        // console.log('----- ARTICOLO ' + i + ' -----');
        const row = document.createElement('div');
        row.classList.add('row-container');
        
        const textRow = document.createElement('div');
        textRow.classList.add('text');

        const insTitle = document.createElement('div');
        insTitle.classList.add('title');
        insTitle.textContent = title;

        const insPrice = document.createElement('div');
        insPrice.classList.add('price');
        if (price.convertedFromValue !== undefined)
            insPrice.textContent = price.convertedFromCurrency + ' ' + price.convertedFromValue;
        else
            insPrice.textContent = price.currency + ' ' + price.value;

        const insShipping = document.createElement('div');
        insShipping.classList.add('shipping');
      
        // console.log(typeof shippingOptions);
        if (typeof shippingOptions !== 'undefined') {
            for (const shippingOption of shippingOptions) {
                const { shippingCost } = shippingOption;
                const { convertedFromValue, convertedFromCurrency } = shippingCost;
                if (price.convertedFromValue !== undefined) {
                    if (convertedFromValue !== '0.00')
                        insShipping.textContent = '+ ' + convertedFromCurrency + ' ' + convertedFromValue + ' di spedizione';
                } else if (shippingCost.value !== '0.00')
                    insShipping.textContent = '+ ' + shippingCost.currency + ' ' + shippingCost.value + ' di spedizione';
                else
                insShipping.textContent = 'Spedizione gratuita';                
            }
        } else
            insShipping.textContent = 'Clicca per più dettagli sulla spedizione';
        // console.log(insShipping.textContent);

        const insCondition = document.createElement('div');
        insCondition.classList.add('condition');
        insCondition.textContent = condition;
        // console.log(`Item ID: ${itemId}`);

        const img = document.createElement('img');
        img.src = image.imageUrl;

        rowLink.href = itemWebUrl;
        // console.log(`Item Web URL: ${itemWebUrl}`);

        const insCountry = document.createElement('div');
        insCountry.textContent = 'From ' + itemLocation.country;
        // console.log(insCountry);

        textRow.appendChild(insTitle);
        textRow.appendChild(insPrice);
        textRow.appendChild(insShipping);
        textRow.appendChild(insCondition);
        // textRow.appendChild(insCountry);

        row.appendChild(textRow);
        row.appendChild(img);
        // searchContainer.appendChild(row);
        rowLink.appendChild(row);
        searchContainer.appendChild(rowLink);
    }

    // console.log(response.next);
    if (response.total > NUM_RESULTS && response.next !== undefined) {
        const nextPageResults = document.createElement('a');
        nextPageResults.textContent = 'Carica altri risultati';
        nextPageResults.dataset.next = response.next;
        nextPageResults.addEventListener('click', loadNextPageResults);
        nextPageLink = document.createElement('h1');
        nextPageLink.appendChild(nextPageResults);
        nextPageLink.id = 'next-page-results';
        searchContainer.appendChild(nextPageLink);
    }
    searchContainer.classList.replace('menu-hidden', 'menu-showed');
}

function removeAccents(input) {
    return input.replace(/[àáâãäå]/gi, 'a')
        .replace(/[èéêë]/gi, 'e')
        .replace(/[ìíîï]/gi, 'i')
        .replace(/[òóôõö]/gi, 'o')
        .replace(/[ùúûü]/gi, 'u')
        .replace(/[ýÿ]/gi, 'y')
        .replace(/ç/gi, 'c')
        .replace(/ñ/gi, 'n');
}

function searchAPIRequest() {
    if (accessToken === null) {
        console.log('Access token missing.');
        return;
    }

    let textSearch = inputSearch.value;
    let categoryId = categorySelect.value;
    
    if (textSearch === '') {
        return;
    }

    searchContainer.innerHTML = '';
;
    textSearch = removeAccents(textSearch);

    textSearch = encodeURIComponent(textSearch);
    categoryId = encodeURIComponent(categoryId);
    // console.log('text: ' + textSearch + ', catid: ' + categoryId);

    fetch('https://corsproxy.io/?https://api.ebay.com/buy/browse/v1/item_summary/search?q=' + textSearch + '&category_ids=' + categoryId + '&offset=0&limit=' + NUM_RESULTS + '&filter=itemLocationCountry:IT', {
        method: "GET",
        headers: {
            'X-EBAY-C-MARKETPLACE-ID':'EBAY_IT',
            'Content-Type': 'application/json;charset=utf-8',
            'Accept-Charset': 'utf-8',
            'Accept-Language': 'it-IT',
            'Content-Language': 'it-IT',
            'Authorization': 'Bearer ' + accessToken
        }
    }).then(onResponseOk, onResponseNo).then(onSearchResponseJSON);
}

function onGetTokenJSON(response) {
    accessToken = response.access_token;
    console.log('Access token received.');

    fetch('https://corsproxy.io/?https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_IT', {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    }).then(onResponseOk, onResponseNo).then(onCategoryTreeJSON);
}

function onGetTokenResponseNo() {
    console.log('Access token not received.');
}

fetch('https://corsproxy.io/?https://api.ebay.com/identity/v1/oauth2/token', {
    method: "POST",
    body: 'grant_type=client_credentials&scope=' + urlEncodeSpaceSeparate(scope),
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': auth
    }
}).then(onResponseOk, onGetTokenResponseNo).then(onGetTokenJSON);