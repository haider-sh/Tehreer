import { readAsStringAsync } from 'expo-file-system/legacy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { Colors } from '../constants/theme';

export interface WordTapPayload {
  word: string;
  fullPageText: string;
  page: number;
}

interface Props {
  /** Local file:// URI of the PDF */
  uri: string;
  /** 1-based page number to display */
  page: number;
  onLoadComplete: (totalPages: number) => void;
  onPageChanged: (page: number) => void;
  onWordTap: (payload: WordTapPayload) => void;
  onError?: (message: string) => void;
}

// ---------------------------------------------------------------------------
// PDF.js viewer HTML
// Loaded from CDN — internet is required (same requirement as the meaning API).
// The PDF data is embedded as a JS global (INITIAL_PDF_B64 / INITIAL_PAGE)
// so no large injectJavaScript calls are needed after load.
// ---------------------------------------------------------------------------
function buildHtml(base64: string, initialPage: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=4,user-scalable=yes">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:#F7F6F3;overflow-x:hidden}
  #viewer{position:relative;display:inline-block}
  #pdfCanvas{display:block;width:100%}
  #textLayer{
    position:absolute;top:0;left:0;right:0;bottom:0;
    overflow:hidden;pointer-events:none;
    line-height:1;
  }
  #textLayer span{
    color:transparent;position:absolute;white-space:pre;
    cursor:pointer;transform-origin:0% 0%;
    pointer-events:all;border-radius:3px;
    transition:background-color 0.12s;
    -webkit-tap-highlight-color:transparent;
  }
  #textLayer span.tapped{background:rgba(46,125,107,0.28)}
  #spinner{
    position:fixed;top:50%;left:50%;
    transform:translate(-50%,-50%);
    font:14px system-ui;color:#6E6E73;
  }
</style>
</head>
<body>
<div id="spinner">Loading…</div>
<div id="viewer">
  <canvas id="pdfCanvas"></canvas>
  <div id="textLayer"></div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
(function(){
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const B64 = '${base64}';
  let currentPage = ${initialPage};
  let pdfDoc = null;
  let rendering = false;

  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;

  function post(obj){ window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }

  /* Decode base64 → Uint8Array without stack-overflow on large strings */
  function b64ToBytes(b64){
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    return bytes;
  }

  function renderPage(num){
    if(!pdfDoc || rendering) return;
    rendering = true;

    pdfDoc.getPage(num).then(function(page){
      const dpr = window.devicePixelRatio || 1;
      const vp0 = page.getViewport({scale:1});
      const scale = window.innerWidth / vp0.width;
      const vp = page.getViewport({scale});

      const canvas = document.getElementById('pdfCanvas');
      const ctx = canvas.getContext('2d');
      canvas.width  = Math.floor(vp.width  * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width  = vp.width  + 'px';
      canvas.style.height = vp.height + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);

      const viewer = document.getElementById('viewer');
      viewer.style.width  = vp.width  + 'px';
      viewer.style.height = vp.height + 'px';

      const tl = document.getElementById('textLayer');
      tl.style.width  = vp.width  + 'px';
      tl.style.height = vp.height + 'px';
      tl.innerHTML = '';

      /* Render canvas */
      page.render({canvasContext:ctx, viewport:vp}).promise.then(function(){
        rendering = false;
        post({type:'pageRendered', page:num});
      });

      /* Build text layer */
      page.getTextContent().then(function(tc){
        const fullText = tc.items.map(function(it){ return it.str; }).join(' ');

        tc.items.forEach(function(item){
          if(!item.str.trim()) return;

          /* Transform item coordinates into viewport space */
          const tx = pdfjsLib.Util.transform(vp.transform, item.transform);
          /* tx = [a,b,c,d,e,f] — (e,f) = bottom-left of glyph in CSS pixels */
          const fontH = Math.abs(tx[3]);   /* height in CSS px */
          const fontW = Math.abs(tx[0]);   /* horizontal scale */

          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.left     = tx[4] + 'px';
          span.style.top      = (tx[5] - fontH) + 'px';
          span.style.fontSize = fontH + 'px';
          if(fontW && fontH){
            span.style.transform = 'scaleX(' + (fontW / fontH) + ')';
          }

          span.ontouchstart = function(e){
            e.stopPropagation();
            document.querySelectorAll('#textLayer span.tapped')
              .forEach(function(s){ s.classList.remove('tapped'); });
            span.classList.add('tapped');
            post({type:'wordTap', word:item.str.trim(), fullPageText:fullText, page:num});
          };

          tl.appendChild(span);
        });
      });
    }).catch(function(err){ post({type:'error', message:err.message}); });
  }

  /* Navigate to a different page (called via injectJavaScript) */
  window.goToPage = function(n){
    if(n === currentPage) return;
    currentPage = n;
    renderPage(currentPage);
  };

  /* Load PDF from embedded base64 */
  document.getElementById('spinner').style.display = 'block';
  pdfjsLib.getDocument({data: b64ToBytes(B64)}).promise.then(function(doc){
    pdfDoc = doc;
    document.getElementById('spinner').style.display = 'none';
    post({type:'loadComplete', totalPages:doc.numPages});
    renderPage(currentPage);
  }).catch(function(err){
    document.getElementById('spinner').textContent = 'Error loading PDF';
    post({type:'error', message:err.message});
  });
})();
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PdfWebViewer({
  uri,
  page,
  onLoadComplete,
  onPageChanged,
  onWordTap,
  onError,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const [htmlSource, setHtmlSource] = useState<string | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const currentPageRef = useRef(page);

  /* Read PDF as base64 once and build the HTML */
  useEffect(() => {
    if (!uri) return;
    setHtmlSource(null);
    setWebViewReady(false);
    currentPageRef.current = page;

    readAsStringAsync(uri, { encoding: 'base64' })
      .then((b64) => setHtmlSource(buildHtml(b64, page)))
      .catch((err) => onError?.(err.message));
  }, [uri]);

  /* Navigate when page prop changes after initial load */
  useEffect(() => {
    if (!webViewReady || page === currentPageRef.current) return;
    currentPageRef.current = page;
    webViewRef.current?.injectJavaScript(`goToPage(${page}); true;`);
  }, [page, webViewReady]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          totalPages?: number;
          page?: number;
          word?: string;
          fullPageText?: string;
          message?: string;
        };

        switch (msg.type) {
          case 'loadComplete':
            setWebViewReady(true);
            onLoadComplete(msg.totalPages ?? 0);
            break;
          case 'pageRendered':
            onPageChanged(msg.page ?? page);
            break;
          case 'wordTap':
            if (msg.word && msg.fullPageText != null) {
              onWordTap({
                word: msg.word,
                fullPageText: msg.fullPageText,
                page: msg.page ?? page,
              });
            }
            break;
          case 'error':
            onError?.(msg.message ?? 'Unknown PDF error');
            break;
        }
      } catch {
        // malformed message — ignore
      }
    },
    [onLoadComplete, onPageChanged, onWordTap, onError, page]
  );

  if (!htmlSource) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlSource, baseUrl: 'about:blank' }}
        onMessage={handleMessage}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        /* Allow file:// access not needed — PDF loaded as base64 in HTML */
        originWhitelist={['*']}
        mixedContentMode="always"
        /* Let the user pinch-zoom the page */
        scrollEnabled
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        /* Suppress the "Did you mean to navigate?" dialog */
        setSupportMultipleWindows={false}
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        )}
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  webView: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
