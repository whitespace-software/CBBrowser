function fillResults(data) {
    $("#results").html("<pre>" + JSON.stringify(data, null, 2) + "</pre>");
}

function setLastID(id) {
    $("#lastID").html(id);
}

function clearDocumentation() {
    $("#documentation").html("");
}

function getUser() {
    return $("#txtUserName").val();
}
function getPassword() {
    return $("#txtPassword").val();
}

function ajaxGet(url, data, successFn) {
    sayUser("GET " + url + " " + data.docID );
    clearDocumentation();
    $.ajax({
        type: "GET",
        url: url,
        data : data,
        error: function (xhr, textStatus, errorThrown) {
            console.log(xhr, textStatus, errorThrown);
            sayUser("GET " + url + " ERROR:" + errorThrown + " : " + xhr.responseText);
        },
        success: function (data) {
            successFn(data);
        }
    });
}

function sayUser(msg) {
    $("#lblSayuser").html(msg);
}

function makeObjectPathAndValue(data, path, raw ) {
    var val, sgmts, i, sgmt, ob;

    sgmts = path.split(".");
    val = "";
    for (i = 0; i < sgmts.length; i++) {
        sgmt = splitIndex(sgmts[i]);

        if (i == 0)
            ob = data[sgmt.id];
        else
            ob = ob[sgmt.id];
        if (sgmt.index >= 0 && ob != undefined) {
            ob = ob[sgmt.index];
        }
        if (ob === undefined) {
            val = "undefined at " + sgmts[i];
            break;
        } else {
            val = ob;
        }
    }
    if (raw)
        val = "<pre>" + JSON.stringify(val, null, 2) + "</pre>";
    return "<div class='ObjectPath'>" + path + "</div><div class='ObjectValue'>" + val + "&nbsp;</div>";
}



function splitIndex(sgmt) {
    var parts = sgmt.split("[");
    if (parts.length == 1)
        return { id: sgmt, index: -1 };
    else
        return { id: parts[0], index: parseInt(parts[1], 10) };
}

var _all_docs = null;

function findIdUsingForm()
{
    var docID = $.trim($("#txtDocumentID").val());
    findId(docID);
}
function findId(id) {
    $("#txtDocumentID").val(id);
    fetchDocument( id )
}

function doLogin() {
    fetchDocument("_all_docs");
}

function getQuartet()
{
    var q = {};
    q.server = $.trim($("#txtServer").val());
    q.bucket = $.trim($("#txtBucket").val());
    q.userName = $.trim($("#txtUserName").val());
    q.password = $.trim($("#txtPassword").val());
    return q;
}

function fetchDocument( docID )
{
    var q = getQuartet();

    if ( !q.server || !q.bucket || !q.userName || !q.password) {
        sayUser("Please enter server, bucket, user name and password");
        return;
    }
    q.docID = docID;
    var url = "document";

    ajaxGet(url, q, function (data) {
        console.log(data);
        if (data.error) {
            sayUser(data.error);
            localStorage.password = "";
        }
        else {
            sayUser("Retrieved " + q.server + "/" + q.bucket + "/" + q.docID);
            localStorage.password = q.password;
            fillResults(data);
            if (docID == "_all_docs")
            {
                _all_docs = data;
                $("#masterList").html(buildFromAllDocs());
            }
            else
            {
                fillMasterList(data);
            }
        }
        localStorage.server = q.server;
        localStorage.bucket = q.bucket;
        localStorage.userName = q.userName;
        setUserNameAndPassword();
    });
}

function doLogout() {
    localStorage.userName = "";
    localStorage.password = "";
    setUserNameAndPassword();
}

function setUserNameAndPassword() {
    $("#txtServer").val(localStorage.server || "");
    $("#txtBucket").val(localStorage.bucket || "");
    $("#txtUserName").val(localStorage.userName || "");
    $("#txtPassword").val(localStorage.password || "");
}

function initSayuser() {
    $("#lblSayuser").addClass("alert alert-danger");
}

function fillMasterList(data) {
    var html = "";
    html = buildFromAnyDoc(data);
    $("#masterList").html(html);
}

var _last_extras = "";
var _last_doc = null;

function buildFromAnyDoc(data) {
    var html = "";
    _last_doc = data;
    html += makeObjectPathAndValue(data, "_id");
    html += makeObjectPathAndValue(data, "_rev");
    html += makeObjectPathAndValue(data, "channels");
    html += makeObjectPathAndValue(data, "type");
    html += makeObjectPathAndValue(data, "createdAt");
    if( $.trim(_last_extras))
        html += makeObjectPathAndValue(data, _last_extras, true );
    return html;
}

function changedExtras()
{
    _last_extras = $("#txtExtras").val();
    if (_last_doc)
        $("#masterList").html(buildFromAnyDoc(_last_doc));
}

function makeCmd( cmd )
{
    var q, curl, rev;
    if (!_last_doc) {
        sayUser("Please GET a document first");
        return;
    }
    q = getQuartet();
    curl = "curl -u " + q.userName + ":" + q.password + " -k " + q.server + "/" + q.bucket + "/" + _last_doc._id;
    rev = _last_doc._rev;
    if (cmd == "DEL")
        curl += "?rev=" + rev + " -X DELETE";
    if (cmd == "ATT")
        curl += "/(filename)" + "?rev=" + rev + " -X PUT -H \"Content-Type:image.jpeg\"";
    if (cmd == "PUT")
        curl += "?rev=" + rev + " -X PUT -T " + _last_doc._id + ".txt";

    sayUser(curl);
}

function filterChanged() {
    if (_all_docs)
        $("#masterList").html(buildFromAllDocs());
    else
        sayUser("Login first");
}

function buildFromAllDocsCall(data) {
    return buildFromAllDocs();
}

function buildFromAllDocs() {
    var html = "", filter = $.trim($("#txtFilter").val()).toLowerCase(), id;

    if ($.isArray(_all_docs.rows)) {
        $.each(_all_docs.rows, function (i, item) {
            if (matches(item.id, filter))
                html += "<div>" + makeLink(item) + "</div>";
        });
    }
    else {
        $.each(_all_docs, function (key, item) {
            if (item.id.indexOf("_sync") < 0 && matches(item.id, filter))
                html += makeListDiv(item);
        });
    }
    return html;
}

function makeListDiv(item) {
    return "<div>" + makeLink(item) + "</div>";
}

function makeLink(item) {
    var dq = '"';
    return "<a href='javascript:findId(" + dq + item.id + dq + ")'>" + formatListItem(item) + "</a>";
}

function formatListItem(item) {
    var elts = [item.id, item.type, item.createdAt], strs = [];
    if (item.value)
        elts.push( parseInt(item.value.rev) );
    $.each(elts, function (i, itm) {
        if (itm)
            strs.push(itm.toString());
    })
    return strs.join(" : ");    // item.id + ' : ' + item.type + " : " + item.createdAt;
}

function matches(id, filter) {
    if (!filter)
        return true;
    return (id.toLowerCase().indexOf(filter) >= 0);
}

$(document).ready(function () {
    initSayuser();
    setUserNameAndPassword();
    $("#txtFilter").keyup(filterChanged);
});