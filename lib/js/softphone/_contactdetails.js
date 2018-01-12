// Contact Details page
define(['jquery', 'common', 'stringres', 'global'], function($, common, stringres, global)
{
var ctid = -1;
var contact = null;
var iscontact = false; // true if it's a saved contact in contacts list
var frompage = '';
var isfavorite = false; // is contact favorite

function onCreate (event) // called only once - bind events here
{
    try{
    common.PutToDebugLog(4, "EVENT, _contactdetails: onCreate");

    $( window ).resize(function() // window resize handling
    {
        if ($.mobile.activePage.attr('id') === 'page_contactdetails')
        {
            MeasureContactdetails();
        }
    });
    
    $('#contactdetails_menu_ul').on('click', 'li', function(event)
    {
        MenuItemSelected($(this).attr('id'));
    });
    $("#btn_contactdetails_menu").on("click", function() { CreateOptionsMenu('#contactdetails_menu_ul'); });
    $("#btn_contactdetails_menu").attr("title", stringres.get("hint_menu"));
    
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: onCreate", err); }
}

function onStart(event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _contactdetails: onStart");
    global.isContactdetailsStarted = true;
    
    //document.getElementById("app_name_contactdetails").innerHTML = common.GetBrandName();
    $(".separator_line_thick").css( 'background-color', common.HoverCalc(common.getBgColor('#page_contactdetails'), -30) );
    
    if (!common.isNull(document.getElementById('contactdetails_title')))
    {
        document.getElementById('contactdetails_title').innerHTML = stringres.get("ctdetails_title");
    }
    $("#contactdetails_title").attr("title", stringres.get("hint_page"));

    if (!common.isNull(document.getElementById('ctdetails_btnback')))
    {
        document.getElementById('ctdetails_btnback').innerHTML = '<span>&LT;</span>&nbsp;' + stringres.get("ctdetails_btnback_txt");
    }
    
// needed for proper display of page height
    MeasureContactdetails();
    
    var modified = (common.GetTickCount()).toString();
    var ctname = common.GetIntentParam(global.intentctdetails, 'ctname');
    var ctnumber = common.GetIntentParam(global.intentctdetails, 'ctnumber');

    try { ctid = common.StrToInt( common.GetIntentParam(global.intentctdetails, 'ctid') ); } catch(err) { common.PutToDebugLogException(2, "_contactdetails: onStart can't convert ctid to INT", err); }
    
    if (ctid < 0 && !common.isNull(ctnumber) && ctnumber.length > 0)
    {
        ctid = common.GetContactIdFromNumber(ctnumber);
    }
    
    if (ctid >= 0)
    {
        iscontact = true;
        contact = global.ctlist[ctid];
    }
    
//    PopulateData();
    
    if (ctid >= 0)
    {
        $("#btn_contactdetails_favorite").show();
        isfavorite = common.ContactIsFavorite(ctid);
        if (isfavorite === true)
        {
            $("#btn_contactdetails_favorite").attr('src', '' + common.GetElementSource() + 'images/btn_star_on_normal_holo_light.png').attr("title", stringres.get("menu_ct_unsetfavorite"));
        }else
        {
            $("#btn_contactdetails_favorite").attr('src', '' + common.GetElementSource() + 'images/btn_star_off_normal_holo_light.png').attr("title", stringres.get("menu_ct_setfavorite"));
        }
    }else
    {
        iscontact = false;
        if (common.isNull(ctname)) { ctname = ''; }
        if (common.isNull(ctnumber)) { ctnumber = ''; }
        
        if (ctname.length > 0 && ctname === ctnumber)
        {
            ctname = common.GetContactNameFromNumber(ctnumber);
        }

        contact = [];
        contact[common.CT_NAME] = ctname;
        contact[common.CT_NUMBER] = [ctnumber];
        contact[common.CT_PTYPE] = ['other'];
        contact[common.CT_USAGE] = '0';
        contact[common.CT_LASTMODIF] = modified;
        contact[common.CT_DELFLAG] = '0';
        contact[common.CT_FAV] = '0';
        contact[common.CT_EMAIL] = '';
        contact[common.CT_ADDRESS] = '';
        contact[common.CT_NOTES] = '';
        contact[common.CT_WEBSITE] = '';
    }
    
    PopulateData();
    
    frompage = common.GetIntentParam(global.intentctdetails, 'frompage');
    
    if (frompage === 'dialpad' && !common.isNull(document.getElementById('ctdetails_btnback')))
    {
        document.getElementById('ctdetails_btnback').innerHTML = '<span>&LT;</span>&nbsp;' + stringres.get("go_back_btn_txt");
    }
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: onStart", err); }
}

function MeasureContactdetails() // resolve window height size change
{
    try{
    //var pgh = common.GetDeviceHeight() - 1; $('#page_contactdetails').css('min-height', pgh + 'px'); // must be set when softphone is skin in div
    $('#page_contactdetails').css('min-height', 'auto'); // must be set when softphone is skin in div

    var heightTemp = common.GetDeviceHeight() - $("#contactdetails_header").height();
    heightTemp = heightTemp - 3;
    $("#page_contactdetails_content").height(heightTemp);
    
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: MeasureContactdetails", err); }
}

var isctblocked = false;
function PopulateData()
{
    var enablepres = false;
    var presencequery = '';
    try{
    if (common.isNull(contact) || contact.length < 1)
    {
        common.PutToDebugLog(2, 'ERROR, _contactdetails PopulateData contact is NULL');
        return;
    }
    
    $("#page_contactdetails_content").html('');
    
    var content = '<div id="contact_name">' +
                        '<p>' + contact[common.CT_NAME] + '</p>' +
                        '<div id="contact_blocked">' +
                            '<img src="' + common.GetElementSource() + 'images/icon_block.png" id="contact_blocked_img" />' +
                        '</div>' +
                        '<div id="contact_favorite">' +
                            '<img id="btn_contactdetails_favorite" style="display: none;" src="' + common.GetElementSource() + 'images/btn_star_off_normal_holo_light.png" title="" />' +
                        '</div>' +
                    '</div>';
    
    var numbers = contact[common.CT_NUMBER];
    var types = contact[common.CT_PTYPE];
    
    if (common.UsePresence2() === true)
    {
        enablepres = true;
    }
    
    // check if contact is blocked
    if (!common.isNull(numbers) && numbers.length > 0)
    {
        if (common.IsContactBlocked(null, numbers)) { isctblocked = true; }
    }
    
    if (!common.isNull(numbers) && numbers.length > 0)
    {
        for (var i = 0; i < numbers.length; i++)
        {
            var presenceimg = ''; //<img src="images/presence_available.png" />

            if (enablepres)
            {
                var presence = global.presenceHM[numbers[i]];

                // -1=not exists(undefined), 0=offline, 1=invisible, 2=idle, 3=pending, 4=DND, 5=online
                
                if (common.isNull(presence) || presence.length < 1)
                {
                    presenceimg = '';
                    
                    if (presencequery.length > 0) { presencequery = presencequery + ','; }
                    presencequery = presencequery + numbers[i];
                }
                else if (presence === '0') // offline
                {
                    presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_grey.png" />';
                }
                else if (presence === '1') // invisible
                {
                    presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_white.png" />';
                }
                else if (presence === '2') // idle
                {
                    presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_yellow.png" />';
                }
                else if (presence === '3') // pending
                {
                    presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_orange.png" />';
                }
                else if (presence === '4') // DND
                {
                    presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_red.png" />';
                }
                else if (presence === '5') // online
                {
                    presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_green.png" />';
                }
                else
                {
                    presenceimg = '';
                }
            }
            
            // don't display "Call other", just "Call"
            var type = stringres.get('type_' + types[i]);
            if (numbers.length < 2) { type = common.Trim(type.substring(0, type.indexOf(' '))); }
            
            var itemcall = 
                '<div id="ct_entry_' + i + '" class="cd_container">' +
                    '<div id="cd_call_' + i + '" class="cd_call">' +
                        '<div class="cd_data">' +
                            '<div class="cd_type">' + type + '</div>' +
                            '<div class="cd_number">' + numbers[i] + '</div>' +
                        '</div>' +
                        '<div class="cd_icon">' +
                            presenceimg + '<img src="' + common.GetElementSource() + 'images/icon_call.png" />' +
                        '</div>' +
                    '</div>' +
                '</div>';
        
            var itemmsg = 
                '<div id="ct_entry_' + i + '" class="cd_container">' +
                    '<div id="cd_msg_' + i + '" class="cd_call">' +
                        '<div class="cd_data">' +
                            '<div class="cd_type">' + stringres.get('send_msg') + '</div>' +
                            '<div class="cd_number">' + numbers[i] + '</div>' +
                        '</div>' +
                        '<div class="cd_icon">' +
                            presenceimg + '<img src="' + common.GetElementSource() + 'images/icon_message.png" />' +
                        '</div>' +
                    '</div>' +
                '</div>';
        
            var itemvideo = '';
            if (common.GetParameter2('video') === '1' || (common.GetParameter2('video') === '-1' && common.getuseengine() === global.ENGINE_WEBRTC))
            {
                itemvideo = 
                '<div id="ct_entry_' + i + '" class="cd_container">' +
                    '<div id="cd_video_' + i + '" class="cd_call">' +
                        '<div class="cd_data">' +
                            '<div class="cd_type">' + stringres.get('video_call') + '</div>' +
                            '<div class="cd_number">' + numbers[i] + '</div>' +
                        '</div>' +
                        '<div class="cd_icon">' +
                            presenceimg + '<img src="' + common.GetElementSource() + 'images/btn_video_txt.png" />' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }


// handle hidesettings
            if (common.HideSettings('chat', stringres.get('sett_display_name_' + 'chat'), 'chat', true) === true)
            {
                itemmsg = '';
            }
            if (common.HideSettings('video', stringres.get('sett_display_name_' + 'video'), 'video', true) === true)
            {
                itemvideo = '';
            }
            if (common.Glvd() < 0) { itemvideo = ''; }
                
            content = content + itemcall + itemmsg + itemvideo;
        }
    }
    
    var backtitle = '';
    if (frompage === 'dialpad')
    {
        backtitle = stringres.get('btn_close');
    }else
    {
        backtitle = stringres.get('ctdetails_btnback_txt');
    }

    var controls = '';
    
    if (iscontact)
    {
        controls = controls +
            '<div id="ct_edit_entry" class="cd_container">' +
                '<div id="ct_edit_entry_button" class="cd_call">' +
                    '<div class="cd_button">' + stringres.get('menu_editcontact') + '</div>' +
                '</div>' +
            '</div>' +
            '<div id="ct_delete_entry" class="cd_container">' +
                '<div id="ct_delete_entry_button" class="cd_call">' +
                    '<div class="cd_button">' + stringres.get('menu_deletecontact') + '</div>' +
                '</div>' +
            '</div>';
    }else
    {
        controls = controls +
        '<div id="ct_save_entry" class="cd_container">' +
            '<div id="ct_save_entry_button" class="cd_call">' +
                '<div class="cd_button">' + stringres.get('menu_createcontact') + '</div>' +
            '</div>' +
        '</div>';
    }
    
    controls = controls +
        '<div id="ct_allcontacts_entry" class="cd_container">' +
            '<div id="ct_allcontacts_entry_button" class="cd_call">' +
                '<div class="cd_button">' + backtitle + '</div>' +
            '</div>' +
        '</div>';

    content = content + controls;

    $("#page_contactdetails_content").html(content);
    
    if (isctblocked === true)
    {
        $('#contact_blocked_img').show();
    }

// add event listeners
    if (!common.isNull(numbers) && numbers.length > 0)
    {
        for (var i = 0; i < numbers.length; i++)
        {
            (function (i)
            {
                $('#cd_call_' + i).on('click', function() { OnItemClick(i, 0); });
                $('#cd_msg_' + i).on('click', function() { OnItemClick(i, 1); });
                $('#cd_video_' + i).on('click', function() { OnItemClick(i, 2); });
            }(i));
        }
    }
    
    $('#ct_edit_entry_button').on('click', function() { EditContact(); });
    $('#ct_delete_entry_button').on('click', function() { DeleteContactPopup(); });
    $('#ct_save_entry_button').on('click', function() { SaveContact(); });
    $('#ct_allcontacts_entry_button').on('click', function() { $.mobile.back(); });
    
    
// handle favorite
    $("#btn_contactdetails_favorite").off("click");
    $("#btn_contactdetails_favorite").on("click", function()
    {
        ToggleFavorite();
    });
    
    if (ctid >= 0) // means it's a contact, not JUST A NUMBER
    {
        $("#btn_contactdetails_favorite").show();
        isfavorite = common.ContactIsFavorite(ctid);
        if (isfavorite === true)
        {
            $("#btn_contactdetails_favorite").attr('src', '' + common.GetElementSource() + 'images/btn_star_on_normal_holo_light.png').attr("title", stringres.get("menu_ct_unsetfavorite"));
        }else
        {
            $("#btn_contactdetails_favorite").attr('src', '' + common.GetElementSource() + 'images/btn_star_off_normal_holo_light.png').attr("title", stringres.get("menu_ct_setfavorite"));
        }
    }
// END handle favorite
    
    if (enablepres && presencequery.length > 0)
    {
        presencequery = presencequery.replace('-', '');
        presencequery = presencequery.replace('-', '');
        presencequery = presencequery.replace('-', '');
        presencequery = presencequery.replace('(', '');
        presencequery = presencequery.replace(')', '');
        
        //var retval = webphone_api.checkpresence(presencequery);
        //common.PutToDebugLog(3, "EVENT, _contactdetails PopulateData API_CheckPresence: " + retval);
        common.PresenceGet2(presencequery);
    }
    
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: PopulateData", err); }
}

function ToggleFavorite()
{
    try{
    if (isfavorite === true)
    {
        $("#btn_contactdetails_favorite").attr('src', '' + common.GetElementSource() + 'images/btn_star_off_normal_holo_light.png').attr("title", stringres.get("menu_ct_setfavorite"));
        common.ContactSetFavorite(ctid, false);
    }else
    {
        $("#btn_contactdetails_favorite").attr('src', '' + common.GetElementSource() + 'images/btn_star_on_normal_holo_light.png').attr("title", stringres.get("menu_ct_unsetfavorite"));
        common.ContactSetFavorite(ctid, true);
    }
    isfavorite = !isfavorite;

    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: ToggleFavorite", err); }
}
    
var trigerred = false; // handle multiple clicks
function OnItemClick(contactid, type) // type: 0=call, 1=chat, 2=video call
{
    try{
    if (trigerred) { return; }
    
    trigerred = true;
    setTimeout(function ()
    {
        trigerred = false;
    }, 1000);

    if (common.isNull(contactid)) { return; }
    
    var numbers = contact[common.CT_NUMBER];
    var to = numbers[contactid];
    var name = contact[common.CT_NAME];
    
    if (type === 0)
    {
        common.PutToDebugLog(4, 'EVENT, _contactdetails initiate call to: ' + to);
        
        setTimeout(function () // timeout, so $.mobile.back(); won't close call page
        {
            webphone_api.call(to, -1);
        }, 100);
        
        if (common.getuseengine() === 'p2p')
        {
            return;
        }
        $.mobile.back();
/*
        setTimeout(function ()
        {
            $.mobile.changePage("#page_call", { transition: "pop", role: "page" });
        }, 20);*/

        //$.mobile.changePage("#page_call", { transition: "pop", role: "page" });
    }
    else if (type === 1)
    {
        common.StartMsg(to, '', '_contactdetails');
    }
    else if (type === 2)
    {
        webphone_api.videocall(to);
    }
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: OnItemClick", err); }
}

var MENUITEM_CONTACTDETAILS_EDIT = '#menuitem_contactdetails_edit';
var MENUITEM_CONTACTDETAILS_DELETE = '#menuitem_contactdetails_delete';
var MENUITEM_CONTACTDETAILS_CREATE = '#menuitem_contactdetails_create';
var MENUITEM_CONTACTDETAILS_BLOCKCT = '#menuitem_contactdetails_blockct';
var MENUITEM_CONTACTDETAILS_FAVORITE = '#menuitem_contactdetails_favorite';

function CreateOptionsMenu (menuId) // adding items to menu, called from html
{
    try{
// remove data transition for windows softphone, because it's slow
    if (common.IsWindowsSoftphone())
    {
        $( "#btn_contactdetails_menu" ).removeAttr('data-transition');
    }

    if ( common.isNull(menuId) || menuId.lenght < 1 ) { common.PutToDebugLog(2, "ERROR, _contactdetails: CreateOptionsMenu menuid null"); return; }

    if ($(menuId).length <= 0) { common.PutToDebugLog(2, "ERROR, _contactdetails: CreateOptionsMenu can't get reference to Menu"); return; }
    
    if (menuId.charAt(0) !== '#') { menuId = '#' + menuId; }

    $(menuId).html('');
    
    if (iscontact)
    {
        $(menuId).append( '<li id="' + MENUITEM_CONTACTDETAILS_EDIT + '"><a data-rel="back">' + stringres.get('menu_editcontact') + '</a></li>' ).listview('refresh');
    
        $(menuId).append( '<li id="' + MENUITEM_CONTACTDETAILS_DELETE + '"><a data-rel="back">' + stringres.get('menu_deletecontact') + '</a></li>' ).listview('refresh');
    }else
    {
        $(menuId).append( '<li id="' + MENUITEM_CONTACTDETAILS_CREATE + '"><a data-rel="back">' + stringres.get('menu_createcontact') + '</a></li>' ).listview('refresh');
    }
    
    var blocktitle = stringres.get('menu_block_contact');
    if (isctblocked === true) { blocktitle = stringres.get('menu_unblock_contact'); }
    	
    $(menuId).append( '<li id="' + MENUITEM_CONTACTDETAILS_BLOCKCT + '"><a data-rel="back">' + blocktitle + '</a></li>' ).listview('refresh');

    var favtitle = stringres.get('menu_ct_setfavorite');
    if (isfavorite === true) { favtitle = stringres.get('menu_ct_unsetfavorite'); }
    	
    $(menuId).append( '<li id="' + MENUITEM_CONTACTDETAILS_FAVORITE + '"><a data-rel="back">' + favtitle + '</a></li>' ).listview('refresh');

    return true;
    
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: CreateOptionsMenu", err); }
    
    return false;
}

function MenuItemSelected(itemid)
{
    try{
    if (common.isNull(itemid) || itemid.length < 1) { return; }
    
    $( '#contactdetails_menu' ).on( 'popupafterclose', function( event )
    {
        $( '#contactdetails_menu' ).off( 'popupafterclose' );
        
        switch (itemid)
        {
            case MENUITEM_CONTACTDETAILS_EDIT:
                EditContact();
                break;
            case MENUITEM_CONTACTDETAILS_DELETE:
                DeleteContactPopup();
                break;
            case MENUITEM_CONTACTDETAILS_CREATE:
                SaveContact();
                break;
            case MENUITEM_CONTACTDETAILS_BLOCKCT:
                ToggleCtBlocked();
                break;
            case MENUITEM_CONTACTDETAILS_FAVORITE:
                ToggleFavorite();
                break;
        }
    });
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: MenuItemSelected", err); }
}

function ToggleCtBlocked()
{
    try{
    if (isctblocked === true)
    {
        isctblocked = false;
        $('#contact_blocked_img').hide();

        var numbers = contact[common.CT_NUMBER];
        if (!common.isNull(numbers) && numbers.length > 0)
        {
            common.UnBlockContact(null, numbers);
        }
    }else
    {
        isctblocked = true;
        $('#contact_blocked_img').show();

        var numbers = contact[common.CT_NUMBER];
        if (!common.isNull(numbers) && numbers.length > 0)
        {
            common.BlockContact(null, numbers);
        }
    }
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: ToggleCtBlocked", err); }
}

function SaveContact()
{
    try{
    global.intentaddeditct[0] = 'action=add';
    global.intentaddeditct[1] = 'numbertoadd=' + contact[common.CT_NUMBER][0];
    
    $.mobile.changePage("#page_addeditcontact", { transition: "pop", role: "page" });
    
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: CreateContact", err); }
}

function EditContact() // open AddEditContact activity
{
    try{
    global.intentaddeditct[0] = 'action=edit';
    global.intentaddeditct[1] = 'ctid=' + ctid;
    
    $.mobile.changePage("#page_addeditcontact", { transition: "pop", role: "page" });

    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: EditContact", err); }
}

function DeleteContactPopup(popupafterclose)
{
    try{
    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    
    var template = '' +
'<div id="delete_contact_popup" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('menu_deletecontact') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content adialog_alert">' +
        '<span> ' + stringres.get('contact_delete_msg') + ' </span>' +
//        '<a href="javascript:;" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" data-rel="back">' + stringres.get('btn_close') + '</a>' +
//        '<a href="javascript:;" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" data-rel="back" data-transition="flow">Delete</a>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="btn_adialog_ok" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_ok') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';
 
    popupafterclose = popupafterclose ? popupafterclose : function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });
    
    $.mobile.activePage.find(".messagePopup").bind(
    {
        popupbeforeposition: function()
        {
            $(this).unbind("popupbeforeposition");//.remove();
            var maxHeight =  Math.floor( common.GetDeviceHeight() * 0.6 );  // $(window).height() - 120;
            
            if ($(this).height() > maxHeight)
            {
                $('.messagePopup .ui-content').height(maxHeight);
            }
        }
    });
    
    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#btn_adialog_ok').off('click');
            popupafterclose();
        }
    });
    
    $('#btn_adialog_ok').on('click', function ()
    {
        DeleteContact();
    });
    
    /*global.ctlist.splice(ctid, 1);
    common.SaveContactsFile(function (issaved) { common.PutToDebugLog(4, 'EVENT, _contactdetails: DeleteContact SaveContactsFile: ' + issaved.toString()); });
    
    $.mobile.back();*/
        
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: DeleteContactPopup", err); }
}

function DeleteContact()
{
    try{
    $( '#delete_contact_popup' ).on( 'popupafterclose', function( event )
    {
        $( '#delete_contact_popup' ).off( 'popupafterclose' );

        global.ctlist.splice(ctid, 1);
        common.SaveContactsFile(function (issaved) { common.PutToDebugLog(4, 'EVENT, _contactdetails: DeleteContact SaveContactsFile: ' + issaved.toString()); });

        $.mobile.back();
    });
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: DeleteContact", err); }
}

function onStop(event)
{

    try{
    common.PutToDebugLog(4, "EVENT, _contactdetails: onStop");
    global.isContactdetailsStarted = false;
    
    $('#contact_blocked_img').hide();
    isctblocked = false;
    
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: onStop", err); }
}

function onDestroy (event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _contactdetails: onDestroy");
    global.isContactdetailsStarted = false;
    $("#page_contactdetails_content").html('');
    $("#btn_contactdetails_favorite").off("click");
    
    ctid = -1;
    contact = null;
    iscontact = false;
    frompage = '';
    isfavorite = false;
    
    } catch(err) { common.PutToDebugLogException(2, "_contactdetails: onDestroy", err); }
}

// public members and methods
return {
    onCreate: onCreate,
    onStart: onStart,
    onStop: onStop,
    onDestroy: onDestroy,
    PopulateData: PopulateData
};
});