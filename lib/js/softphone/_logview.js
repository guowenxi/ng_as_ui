// Internal Browser page
define(['jquery', 'common', 'stringres', 'global'], function($, common, stringres, global)
{

function onCreate (event) // called only once - bind events here
{
    try{
    common.PutToDebugLog(4, "EVENT, _logview: onCreate");
    
    $( window ).resize(function() // window resize handling
    {
        if ($.mobile.activePage.attr('id') === 'page_logview')
        {
            MeasureLogview();
        }
    });

    $('#logview_menu_ul').on('click', 'li', function(event)
    {
        MenuItemSelected($(this).attr('id'));
    });
    $("#btn_logview_menu").on("click", function() { CreateOptionsMenu('#logview_menu_ul'); });
    $("#btn_logview_menu").attr("title", stringres.get("hint_menu"));
    
    $("#support_selectall").on("click", function()
    {
        $('#log_text').select();
    });
    
    $("#sendtosupport").on("click", function()
    {
        var additionalinfo = 'Build date: ' + common.GetParameter('codegenerated');
        common.SendLog(additionalinfo + '&#10;' + global.logs);
    });
    
// it's not working on mobile devices
    if (common.GetOs() === 'Android' || common.GetOs() === 'iOS')
    {
        $("#support_selectall").hide();
    }
    
    $("#btn_loghelp").on("click", function()
    {
        common.AlertDialog(stringres.get('help'), stringres.get('logview_help') + ' ' + common.GetParameter('support_email'));
    });
    
    $("#btn_sendlog").on("click", function()
    {
        common.PutToDebugLog(1, 'EVENT, Log upload succeded');
        setTimeout(function ()
        {
            common.PutToDebugLog(1, 'EVENT, Log upload succeded');
        }, 500);
        
        //common.ShowToast(stringres.get('logview_msg'), 20000); // this line is blocking submit
        /*setTimeout(function ()
        {
            $("#btn_loghelp").show();
            
            common.ShowToast(stringres.get('logview_help'));
            
        }, 2000);*/
        
//        $.mobile.back();
        return true;
    });

    if (common.GetOs() !== 'Android' && common.GetOs() !== 'iOS')
    {
        $('#log_text').attr('readonly', 'readonly');
    }
    } catch(err) { common.PutToDebugLogException(2, "_logview: onCreate", err); }
}

function onStart(event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _logview: onStart");
    global.isLogviewStarted = true;
    
    if (!common.isNull(document.getElementById('logview_title')))
    {
        document.getElementById('logview_title').innerHTML = stringres.get("logview_title");
    }
    $("#logview_title").attr("title", stringres.get("hint_page"));

    if (!common.isNull(document.getElementById('logview_btnback')))
    {
        document.getElementById('logview_btnback').innerHTML = '<span>&LT;</span>&nbsp;' + stringres.get("go_back_btn_txt");
    }
    
    $(".separator_line_thick").css( 'background-color', common.HoverCalc(common.getBgColor('#logview_header'), -30) );
    
    $("#label_disable_logs").html(stringres.get('disable_logs'));
    
    /*
    var email = common.GetConfig('log_email');
    
    if (!common.isNull(email) && email.length > 2)
    {
        if (!common.isNull(document.getElementById("sendtosupport_link")))
        {
            document.getElementById("sendtosupport_link").innerHTML = stringres.get("sendtosupport");
        }
        
        if (!common.isNull(document.getElementById("support_selectall")))
        {
            document.getElementById("support_selectall").innerHTML = stringres.get("support_selectall");
        }

        //mailto:test@example.com?subject=subject&body=body
        
        //var href = 'mailto:' + common.Trim(email) + '?subject=JSPhone Log&body=' + stringres.get('support_email_body');
        //href = common.ReplaceAll(href, ' ', '%20');
        
        var href = 'mailto:' + common.Trim(email) + '?subject=' + encodeURIComponent('WebPhone Log') + '&body=' + stringres.get('support_email_body');
        
        $('#sendtosupport_link').attr('href', href);
        
        //Spaces between words should be replaced by %20 to ensure that the browser will display the text properly.
    }else
    {
        $("#sendtosupport_container").hide();
    }*/
    
    //handle logsendto option: 0=no options, 1=mizutech upload, 2=email (support email from config)
    var logsendto = common.GetConfigInt('logsendto', 1);
    
    if (logsendto < 1)
    {
        $("#sendtosupport_container").hide();
    }
    else if (logsendto === 1) // send to mizu with xlogpush
    {
        $('#sendtosupport_link').hide();
        $("#sendtosupport_container").show();
    }
    else if (logsendto === 2) // send in email
    {
        $('#btn_sendlog').hide();

        var email = common.GetConfig('supportmail');
        if (common.isNull(email) || email.length < 2) { email = common.GetConfig('log_email'); }
        
        if (!common.isNull(common.GetConfig('log_email')) && email.length > 2)
        {
            
            $('#sendtosupport_link').html(stringres.get("sendtosupport"));
            $('#sendtosupport_link').show();
            
            //mailto:test@example.com?subject=subject&body=body
            //var href = 'mailto:' + common.Trim(email) + '?subject=JSPhone Log&body=' + stringres.get('support_email_body');
            //href = common.ReplaceAll(href, ' ', '%20');

            var href = 'mailto:' + common.Trim(email) + '?subject=' + encodeURIComponent('WebPhone Log') + '&body=' + stringres.get('support_email_body');
            $('#sendtosupport_link').attr('href', href);

            //Spaces between words should be replaced by %20 to ensure that the browser will display the text properly.
        }
    }
    
    MeasureLogview();
    
    var additionalinfo = 'Build date: ' + common.GetParameter('codegenerated');
    
    $('#log_text').html(additionalinfo + '&#10;' + global.logs);
    //$('#log_text').textinput('refresh');
    //document.getElementById('log_text').value = global.logs;
    
    // add filename parameter to form
    if (!common.isNull(document.getElementById('filename')))
    {
        var srv = common.GetParameter('serveraddress_user');
        if (srv.length < 2) { srv = common.GetParameter('serveraddress'); }
        try{ if (srv.length < 2 && !isNull(webphone_api.parameters) && !isNull(webphone_api.parameters.serveraddress)) { srv = webphone_api.parameters.serveraddress; } } catch(errin) {  }
        if (srv.length < 2) { srv = common.GetConfig('serveraddress'); }
        if (common.isNull(srv)) { srv = ''; }
        srv = srv.replace('://', '');
        
        var logfilename = common.GetParameter('sipusername');
        if (!common.isNull(common.GetParameter('brandname'))) { logfilename = logfilename + '_' + encodeURIComponent(common.GetParameter('brandname')); }
        if (!common.isNull(srv)) { logfilename = logfilename + '_' + encodeURIComponent(srv); }
        
        common.PutToDebugLog(2, 'EVENT, _logview filename: ' + logfilename);
        
        document.getElementById('filename').value = logfilename;
    }
    
    } catch(err) { common.PutToDebugLogException(2, "_logview: onStart", err); }
}

function MeasureLogview() // resolve window height size change
{
    try{
    //var pgh = common.GetDeviceHeight() - 1; $('#page_logview').css('min-height', pgh + 'px'); // must be set when softphone is skin in div
    $('#page_logview').css('min-height', 'auto'); // must be set when softphone is skin in div
    
    $("#page_logview_content").height(common.GetDeviceHeight() - $("#logview_header").height() - 2);
    var ltheight = common.GetDeviceHeight() - $("#logview_header").height() - 5;
    
    if ($('#sendtosupport_container').is(':visible'))
    {
        ltheight = ltheight - $("#sendtosupport_container").height();
    }
    
    $("#log_text").height(ltheight);
    $("#log_text").width(common.GetDeviceWidth());

    } catch(err) { common.PutToDebugLogException(2, "_logview: MeasureLogview", err); }
}

var MENUITEM_CLOSE = '#menuitem_logview_close';

function CreateOptionsMenu (menuId) // adding items to menu, called from html
{
    try{
// remove data transition for windows softphone, because it's slow
    if (common.GetParameter('devicetype') === common.DEVICE_WIN_SOFTPHONE())
    {
        $( "#btn_logview_menu" ).removeAttr('data-transition');
    }

    if ( common.isNull(menuId) || menuId.lenght < 1 ) { common.PutToDebugLog(2, "ERROR, _logview: CreateOptionsMenu menuid null"); return; }

    if ($(menuId).length <= 0) { common.PutToDebugLog(2, "ERROR, _logview: CreateOptionsMenu can't get reference to Menu"); return; }
    
    if (menuId.charAt(0) !== '#') { menuId = '#' + menuId; }
    
    $(menuId).html('');
    $(menuId).append( '<li id="' + MENUITEM_CLOSE + '"><a data-rel="back">' + stringres.get('menu_close') + '</a></li>' ).listview('refresh');

    return true;
    
    } catch(err) { common.PutToDebugLogException(2, "_logview: CreateOptionsMenu", err); }
    
    return false;
}

function MenuItemSelected(itemid)
{
    try{
    if (common.isNull(itemid) || itemid.length < 1) { return; }
    
    $( '#logview_menu' ).on( 'popupafterclose', function( event )
    {
        $( '#logview_menu' ).off( 'popupafterclose' );
        
        switch (itemid)
        {
            case MENUITEM_CLOSE:
                $.mobile.back();
                break;
        }
    });
    } catch(err) { common.PutToDebugLogException(2, "_logview: MenuItemSelected", err); }
}

function onStop(event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _logview: onStop");
    global.isLogviewStarted = false;
    
    if ($('#disable_logs').prop("checked"))
    {
        common.SaveParameter('loglevel', '1');
        common.SaveParameter('jsscriptevent', '2');
        webphone_api.setparameter('jsscriptevent', '2');
        global.loglevel = 1;
        
        $('#disable_logs').prop("checked", false).checkboxradio('refresh');
    }
    
    $('#log_text').html('');
    //document.getElementById('log_text').value = '';
    
    } catch(err) { common.PutToDebugLogException(2, "_logview: onStop", err); }
}

function onDestroy (event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _logview: onDestroy");
    global.isLogviewStarted = false;
    
    } catch(err) { common.PutToDebugLogException(2, "_logview: onDestroy", err); }
}

// public members and methods
return {
    onCreate: onCreate,
    onStart: onStart,
    onStop: onStop,
    onDestroy: onDestroy
};
});