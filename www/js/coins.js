/*
This Javascript is almost entirely from the Zotero COiNS parser library:

https://github.com/zotero/zotero/blob/4.0/chrome/content/zotero/xpcom/openurl.js

Just a few pieces added for convenience.
*/

/*
 * Generates an OpenURL ContextObject from an item
 */
function createContextObject(item, version, asObj) {
  var entries = (asObj ? {} : []);

  function _mapTag(data, tag, dontAddPrefix) {
    if (!data) return;

    if (version === "1.0" && !dontAddPrefix) tag = "rft." + tag;

    if (asObj) {
      if (!entries[tag]) entries[tag] = [];
      entries[tag].push(data);
    } else {
      entries.push(tag + "=" + encodeURIComponent(data));
    }
  }

  if (item.toArray) {
    item = item.toArray();
  }

  // find pmid
  const pmidRe = /(?:\n|^)PMID:\s*(\d+)/g;
  var pmid = pmidRe.exec(item.extra);
  if (pmid) pmid = pmid[1];

  // encode ctx_ver (if available) and encode identifiers
  if (version == "0.1") {
    _mapTag("Zotero:2", "sid", true);
    if (item.DOI) _mapTag("doi:" + item.DOI, "id", true);
    if (item.ISBN) _mapTag(item.ISBN, "isbn", true);
    if (pmid) _mapTag("pmid:" + pmid, "id", true);
  } else {
    _mapTag("Z39.88-2004", "url_ver", true);
    _mapTag("Z39.88-2004", "ctx_ver", true);
    _mapTag("info:sid/zotero.org:2", "rfr_id", true);
    if (item.DOI) _mapTag("info:doi/" + item.DOI, "rft_id", true);
    if (item.ISBN) _mapTag("urn:isbn:" + item.ISBN, "rft_id", true);
    if (pmid) _mapTag("info:pmid/" + pmid, "rft_id", true);
  }

  // encode genre and item-specific data
  if (item.itemType == "journalArticle") {
    if (version === "1.0") {
      _mapTag("info:ofi/fmt:kev:mtx:journal", "rft_val_fmt", true);
    }
    _mapTag("article", "genre");

    _mapTag(item.title, "atitle");
    _mapTag(item.publicationTitle, (version == "0.1" ? "title" : "jtitle"));
    _mapTag(item.journalAbbreviation, "stitle");
    _mapTag(item.volume, "volume");
    _mapTag(item.issue, "issue");
  } else if (item.itemType == "book" || item.itemType == "bookSection" || item.itemType == "conferencePaper" || item.itemType == "report") {
    if (version === "1.0") {
      _mapTag("info:ofi/fmt:kev:mtx:book", "rft_val_fmt", true);
    }

    if (item.itemType == "book") {
      _mapTag("book", "genre");
      _mapTag(item.title, (version == "0.1" ? "title" : "btitle"));
    } else if (item.itemType == "conferencePaper") {
      _mapTag("proceeding", "genre");
      _mapTag(item.title, "atitle");
      _mapTag(item.proceedingsTitle, (version == "0.1" ? "title" : "btitle"));
    } else if (item.itemType == "report") {
      _mapTag("report", "genre");
      _mapTag(item.seriesTitle, "series");
      _mapTag(item.title, (version == "0.1" ? "title" : "btitle"));
    } else {
      _mapTag("bookitem", "genre");
      _mapTag(item.title, "atitle");
      _mapTag(item.publicationTitle, (version == "0.1" ? "title" : "btitle"));
    }

    _mapTag(item.place, "place");
    _mapTag(item.publisher, "publisher");
    _mapTag(item.edition, "edition");
    _mapTag(item.series, "series");
  } else if (item.itemType == "thesis" && version == "1.0") {
    _mapTag("info:ofi/fmt:kev:mtx:dissertation", "rft_val_fmt", true);

    _mapTag(item.title, "title");
    _mapTag(item.publisher, "inst");
    _mapTag(item.type, "degree");
  } else if (item.itemType == "patent" && version == "1.0") {
    _mapTag("info:ofi/fmt:kev:mtx:patent", "rft_val_fmt", true);

    _mapTag(item.title, "title");
    _mapTag(item.assignee, "assignee");
    _mapTag(item.patentNumber, "number");

    if (item.issueDate) {
      _mapTag(Zotero.Date.strToISO(item.issueDate), "date");
    }
  } else {
    //we map as much as possible to DC for all other types. This will export some info
    //and work very nicely on roundtrip. All of these fields legal for mtx:dc according to
    //http://alcme.oclc.org/openurl/servlet/OAIHandler/extension?verb=GetMetadata&metadataPrefix=mtx&identifier=info:ofi/fmt:kev:mtx:dc
    _mapTag("info:ofi/fmt:kev:mtx:dc", "rft_val_fmt", true);
    //lacking something better we use Zotero item types here; no clear alternative and this works for roundtrip
    _mapTag(item.itemType, "type");
    _mapTag(item.title, "title");
    _mapTag(item.publicationTitle, "source");
    _mapTag(item.rights, "rights");
    _mapTag(item.publisher, "publisher");
    _mapTag(item.abstractNote, "description");
    if (item.DOI) {
      _mapTag("urn:doi:" + item.DOI, "identifier");
    } else if (item.url) {
      _mapTag(item.url, "identifier");
    }
  }

  if (item.creators && item.creators.length) {
    // encode first author as first and last
    var firstCreator = item.creators[0];
    if (item.itemType == "patent") {
      _mapTag(firstCreator.firstName, "invfirst");
      _mapTag(firstCreator.lastName, "invlast");
    } else {
      if (firstCreator.isInstitution) {
        _mapTag(firstCreator.lastName, "aucorp");
      } else {
        _mapTag(firstCreator.firstName, "aufirst");
        _mapTag(firstCreator.lastName, "aulast");
      }
    }

    // encode subsequent creators as au
    for (var i = 0; i < item.creators.length; i++) {
      _mapTag((item.creators[i].firstName ? item.creators[i].firstName + " " : "") +
        item.creators[i].lastName, (item.itemType == "patent" ? "inventor" : "au"));
    }
  }

  if (item.date) {
    _mapTag(Zotero.Date.strToISO(item.date), (item.itemType == "patent" ? "appldate" : "date"));
  }
  if (item.pages) {
    _mapTag(item.pages, "pages");
    var pages = item.pages.split(/[-–]/);
    if (pages.length > 1) {
      _mapTag(pages[0], "spage");
      if (pages.length >= 2) _mapTag(pages[1], "epage");
    }
  }
  _mapTag(item.numPages, "tpages");
  _mapTag(item.ISBN, "isbn");
  _mapTag(item.ISSN, "issn");
  _mapTag(item.language, "language");
  if (asObj) return entries;
  return entries.join("&");
}


function notifyZoteroOfUpdates() {
  //Tell Zotero that citation information has been added to the page
  var ev = document.createEvent('HTMLEvents');
  ev.initEvent('ZoteroItemUpdated', true, true);
  document.dispatchEvent(ev);
}


function generateCOiNS(metadata) {
  //Returns a span object in jquery.
  var coin = createContextObject(metadata, "1.0", false);
  var res = $("<span />").attr('title', coin);
  res.addClass("Z3988");
  return res
}

/**
  test = {
    url:'http://some.where/1/2.3',
    ISBN:'123-123234-345345',
    itemType: 'journalArticle',
    title: 'A journal article test entry',
    publicationTitle:'The Publication Title',
    journalAbbreviation:'MD-Res',
    volume:'85',
    issue:'6',
    pages:'1-10',
    language: 'en',
    creators:[{firstName:'Dave', lastName:'Nobody'},
              {firstName: 'Fred', lastName:'Peterson'}]
  };
*/


