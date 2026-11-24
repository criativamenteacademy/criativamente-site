package com.criativamenteacademy.admin;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.*;
import android.widget.*;
import android.view.*;
public class MainActivity extends Activity {
 private WebView web;
 private ValueCallback<Uri[]> chooser;
 private static final String HOME="https://criativamenteacademy.com/admin-aulas";
 @Override public void onCreate(Bundle state) {
 super.onCreate(state);
 LinearLayout root=new LinearLayout(this); root.setOrientation(1);
 Button reload=new Button(this); reload.setText("Atualizar painel"); root.addView(reload);
 web=new WebView(this); root.addView(web,new LinearLayout.LayoutParams(-1,0,1)); setContentView(root);
 WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setAllowFileAccess(false); s.setAllowContentAccess(true); s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW); s.setSupportZoom(true); s.setBuiltInZoomControls(true); s.setDisplayZoomControls(false);
 CookieManager.getInstance().setAcceptCookie(true);
 web.setWebViewClient(new WebViewClient(){
 @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){ Uri u=r.getUrl(); if("https".equals(u.getScheme()) && "criativamenteacademy.com".equals(u.getHost())) return false; if("https".equals(u.getScheme())) {try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){} } return true; }
 });
 web.setWebChromeClient(new WebChromeClient(){
 @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){ if(chooser!=null)chooser.onReceiveValue(null); chooser=cb; try{startActivityForResult(p.createIntent(),42);return true;}catch(Exception e){chooser=null;cb.onReceiveValue(null);return false;} }
 });
 web.setDownloadListener((url,agent,disposition,mime,length)->{if(url.startsWith("https://"))try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception ignored){}});
 reload.setOnClickListener(v->web.reload());
 if(state==null || web.restoreState(state)==null)web.loadUrl(HOME);
 }
 @Override protected void onSaveInstanceState(Bundle b){web.saveState(b);super.onSaveInstanceState(b);}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==42&&chooser!=null){chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));chooser=null;}}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onPause(){CookieManager.getInstance().flush();super.onPause();}
}