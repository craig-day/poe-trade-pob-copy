// Item Class: Body Armours
// Rarity: Rare
// Demon Guardian
// Scalper's Jacket
// --------
// Quality: +4% (augmented)
// Evasion Rating: 186 (augmented)
// Energy Shield: 76 (augmented)
// --------
// Requires: Level 39, 45 Dex, 45 Int
// --------
// Sockets: S S 
// --------
// Item Level: 40
// --------
// 30% increased Armour, Evasion and Energy Shield (rune)
// --------
// 23% increased Evasion and Energy Shield
// +41 to maximum Life
// +30 to Spirit
// +18% to Cold Resistance
// 2.9 Life Regeneration per second
// 45% reduced Bleeding Duration on you

const DIVIDER = "--------\n";

const augmentableAttrToText = (element) => {
    let value = element.textContent;
    let augmented = false;

    for (const span of element.getElementsByTagName('span')) {
        augmented = span.classList.contains('colourAugmented');
    }

    if (value) {
        if (augmented) {
            value += " (augmented)";
        }
        return value + "\n";
    }

    console.warn(`[PoB Copy] Failed to find value for property, ignoring.`, element);
    return null;
}

const requirementsToText = (element) => {
    let value = element.textContent.trim();
    let augmented = false;

    for (const span of element.getElementsByTagName('span')) {
        augmented = span.classList.contains('colourAugmented');
    }

    if (value) {
        if (augmented) {
            value += " (augmented)";
        }
        return value + "\n";
    }

    console.warn(`[PoB Copy] Failed to find value for property, ignoring.`, element);
    return null;
}

const processItemRow = (row) => {
    let pobText = '';

    const nameEle = row.querySelector('div.itemName > span');
    if (!nameEle) {
        return;
    }

    // TODO: get item type
    // TODO: get item rarity

    // Basic descriptors
    const itemName = row.querySelector('div.itemName > span').textContent;
    const itemType = row.querySelector('div.itemName.typeLine > span').textContent;

    pobText += itemName + "\n";
    if (itemType !== itemName) {
        pobText += itemType + "\n";
    }
    pobText += DIVIDER

    // Item Details
    const content = row.querySelector('div.content');

    // Item Level
    const itemLevel = content.querySelector('div.itemLevel > span[data-field]');
    const ilvlLine = augmentableAttrToText(itemLevel);
    if (ilvlLine) {
        pobText += ilvlLine;
    }

    // Requirements
    const requirements = content.querySelector('div.requirements');
    const reqLine = requirementsToText(requirements);
    if (reqLine) {
        pobText += reqLine;
    }
    pobText += DIVIDER;

    // Properties
    const properties = content.querySelectorAll('div.property > span[data-field]');

    for (const property of properties) {
        const propertyLine = augmentableAttrToText(property);
        if (propertyLine) {
            pobText += propertyLine;
        }
    };
    pobText += DIVIDER;

    // Implicits
    const implicits = content.querySelectorAll('div.implicitMod > span[data-field]')
    for (const implicit of implicits) {
        const affix = implicit.textContent;
        if (affix) {
            pobText += affix + "\n";
        }
    }
    // TODO: get variations of implicits like corruptions or runes
    pobText += DIVIDER;  
    
    // Explicits
    const explicits = content.querySelectorAll('div.explicitMod > span[data-field]');
    for (const explicit of explicits) {
        const affix = explicit.textContent;
        if (affix) {
            pobText += affix + "\n";
        }
    };
    pobText += DIVIDER;
    
    // Add the copy button to the item row
    const contactButtons = row.querySelector('div.right > div.details')
    if (contactButtons) {
        const itemId = row.getAttribute('data-id');

        const existing = document.querySelector(`div.pob-copy [data-item-id="${itemId}"]`)
        if (existing) {
            existing.remove();
        }

        const copyBtn = document.createElement('BUTTON');
        copyBtn.textContent = 'Copy Item';
        copyBtn.classList.add('btn', 'btn-default');
        copyBtn.addEventListener('click', (event) => {
            navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
                if (result.state === "granted" || result.state === "prompt") {
                    navigator.clipboard.writeText(pobText).then(
                        () => {
                            copyBtn.textContent = 'Copied!';
                            copyBtn.classList.add('active', 'disabled');
                            copyBtn.setAttribute('disabled', 'disabled');
                            setTimeout(() => {
                                copyBtn.textContent = 'Copy Item';
                                copyBtn.classList.remove('active', 'disabled');
                                copyBtn.removeAttribute('disabled');
                            }, 3000);
                        },
                        () => {
                            // Failed
                        }
                    )
                }
            });
        });

        const copyGroup = document.createElement('DIV');
        copyGroup.setAttribute('data-item-id', itemId);
        copyGroup.classList.add('btns', 'pob-copy');
        copyGroup.setAttribute('role', 'group');
        copyGroup.appendChild(copyBtn);

        contactButtons.insertAdjacentElement('beforeend', copyGroup);
    }
}

const mainObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        if (mutation.type === "childList") {
            if (mutation.addedNodes.length === 1) {
                const node = mutation.addedNodes[0];
                if (node.tagName === "DIV" && node.className === "row") {
                    processItemRow(node);
                }
            }
        }
    }
});

const initObserver = new MutationObserver((mutations, observer) => {
    console.debug('[PoB Copy] init observer callback');
    for (const mutation of mutations) {
        if (mutation.type === "childList") {
            const resultSet = document.querySelector('div.resultset');
            if (resultSet) {
                console.debug('[PoB Copy] switching from init observer to main observer');
                observer.disconnect();
                mainObserver.observe(resultSet, { childList: true });
            }
        }
    }
});

console.debug('[PoB Copy] starting init observer');
initObserver.observe(document.body, { childList: true, subtree: true });
