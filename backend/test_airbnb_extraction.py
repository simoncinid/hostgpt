#!/usr/bin/env python3
"""
Script di prova per estrazione completa dati da Airbnb
Con Playwright per contenuto dinamico - estrae tutto il testo possibile
Estrae tutto il testo e HTML senza alcuna pulizia
"""

import time
import requests
import json
import re
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import gzip
import io
from playwright.sync_api import sync_playwright
import asyncio

def create_session():
    """Crea una sessione requests con headers ottimizzati"""
    session = requests.Session()
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'Sec-CH-UA': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"'
    }
    
    session.headers.update(headers)
    return session

def extract_json_data(html_content):
    """Estrae tutti i dati JSON nascosti nella pagina"""
    print("=== ESTRAZIONE DATI JSON ===")
    json_data = []
    
    # Cerca script con dati JSON
    soup = BeautifulSoup(html_content, 'html.parser')
    scripts = soup.find_all('script')
    
    for i, script in enumerate(scripts):
        if script.string:
            script_content = script.string.strip()
            
            # Cerca JSON objects - pattern più ampi
            json_patterns = [
                r'window\.__INITIAL_STATE__\s*=\s*({.*?});',
                r'window\.__APOLLO_STATE__\s*=\s*({.*?});',
                r'window\.__NEXT_DATA__\s*=\s*({.*?});',
                r'window\.__INITIAL_PROPS__\s*=\s*({.*?});',
                r'window\.__BOOTSTRAP__\s*=\s*({.*?});',
                r'window\.__REDUX_STATE__\s*=\s*({.*?});',
                r'window\.__DATA__\s*=\s*({.*?});',
                r'window\.__CONFIG__\s*=\s*({.*?});',
                r'window\.__ROOM_DATA__\s*=\s*({.*?});',
                r'window\.__PROPERTY_DATA__\s*=\s*({.*?});',
                r'window\.__LISTING_DATA__\s*=\s*({.*?});',
                r'window\.__AIRBNB_DATA__\s*=\s*({.*?});',
                r'var\s+__INITIAL_STATE__\s*=\s*({.*?});',
                r'var\s+__APOLLO_STATE__\s*=\s*({.*?});',
                r'var\s+__NEXT_DATA__\s*=\s*({.*?});',
                r'var\s+__ROOM_DATA__\s*=\s*({.*?});',
                r'var\s+__PROPERTY_DATA__\s*=\s*({.*?});',
                r'var\s+__LISTING_DATA__\s*=\s*({.*?});',
                r'var\s+__AIRBNB_DATA__\s*=\s*({.*?});',
                # Pattern aggiuntivi per Airbnb
                r'window\[Symbol\.for\("__global cache key __"\)\]\s*=\s*({.*?});',
                r'window\._bootstrap\s*=\s*({.*?});',
                r'window\._airbnb\s*=\s*({.*?});',
                r'window\._listing\s*=\s*({.*?});',
                r'window\._property\s*=\s*({.*?});',
                r'window\._room\s*=\s*({.*?});',
                r'window\._pdp\s*=\s*({.*?});',
                r'window\._hyperloop\s*=\s*({.*?});',
                r'window\._niobe\s*=\s*({.*?});',
                # Pattern per dati embedded
                r'"bootstrap-layout-init":\s*({.*?})',
                r'"airbnb-bootstrap-data":\s*({.*?})',
                r'"listing-data":\s*({.*?})',
                r'"property-data":\s*({.*?})',
                r'"room-data":\s*({.*?})',
                r'"pdp-data":\s*({.*?})',
                # Pattern per React/Next.js
                r'__NEXT_DATA__\s*=\s*({.*?});',
                r'__NEXT_DATA__\s*=\s*({.*?})<',
                r'window\.__NEXT_DATA__\s*=\s*({.*?});',
                r'window\.__NEXT_DATA__\s*=\s*({.*?})<',
            ]
            
            for pattern in json_patterns:
                matches = re.findall(pattern, script_content, re.DOTALL)
                for match in matches:
                    try:
                        # Prova a parsare il JSON
                        json_obj = json.loads(match)
                        json_data.append({
                            'script_index': i,
                            'pattern': pattern,
                            'data': json_obj
                        })
                        print(f"Trovato JSON con pattern: {pattern[:50]}...")
                    except json.JSONDecodeError:
                        # Se non è JSON valido, salva comunque il testo
                        json_data.append({
                            'script_index': i,
                            'pattern': pattern,
                            'raw_data': match[:1000] + "..." if len(match) > 1000 else match
                        })
                        print(f"Trovato testo con pattern: {pattern[:50]}...")
            
            # Cerca anche JSON arrays
            array_patterns = [
                r'window\.__INITIAL_STATE__\s*=\s*(\[.*?\]);',
                r'window\.__APOLLO_STATE__\s*=\s*(\[.*?\]);',
                r'window\.__ROOM_DATA__\s*=\s*(\[.*?\]);',
                r'window\.__PROPERTY_DATA__\s*=\s*(\[.*?\]);',
                r'window\.__LISTING_DATA__\s*=\s*(\[.*?\]);',
            ]
            
            for pattern in array_patterns:
                matches = re.findall(pattern, script_content, re.DOTALL)
                for match in matches:
                    try:
                        json_obj = json.loads(match)
                        json_data.append({
                            'script_index': i,
                            'pattern': pattern,
                            'data': json_obj
                        })
                        print(f"Trovato JSON Array con pattern: {pattern[:50]}...")
                    except json.JSONDecodeError:
                        json_data.append({
                            'script_index': i,
                            'pattern': pattern,
                            'raw_data': match[:1000] + "..." if len(match) > 1000 else match
                        })
                        print(f"Trovato testo Array con pattern: {pattern[:50]}...")
    
    return json_data

def extract_api_calls(html_content):
    """Estrae chiamate API e endpoint dalla pagina"""
    print("=== ESTRAZIONE API CALLS ===")
    api_calls = []
    
    # Cerca URL API nei script
    api_patterns = [
        r'https?://[^"\']*api[^"\']*',
        r'https?://[^"\']*airbnb[^"\']*api[^"\']*',
        r'https?://[^"\']*\.airbnb\.com[^"\']*',
        r'fetch\(["\']([^"\']+)["\']',
        r'axios\.[a-z]+\(["\']([^"\']+)["\']',
        r'\.get\(["\']([^"\']+)["\']',
        r'\.post\(["\']([^"\']+)["\']',
        r'\.put\(["\']([^"\']+)["\']',
        r'\.delete\(["\']([^"\']+)["\']',
        r'url:\s*["\']([^"\']+)["\']',
        r'endpoint:\s*["\']([^"\']+)["\']',
        r'baseURL:\s*["\']([^"\']+)["\']',
    ]
    
    for pattern in api_patterns:
        matches = re.findall(pattern, html_content, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0] if match[0] else match[1]
            if match and ('api' in match.lower() or 'airbnb' in match.lower()):
                api_calls.append(match)
    
    return list(set(api_calls))  # Rimuovi duplicati

def extract_hidden_data(html_content):
    """Estrae dati nascosti negli attributi HTML"""
    print("=== ESTRAZIONE DATI NASCOSTI ===")
    hidden_data = []
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Cerca elementi con attributi data-*
    all_elements = soup.find_all()
    
    for element in all_elements:
        if element.attrs:
            element_data = {
                'tag': element.name,
                'text': element.get_text(strip=True),
                'data_attrs': {},
                'all_attrs': dict(element.attrs)
            }
            
            # Estrai tutti gli attributi data-*
            for attr, value in element.attrs.items():
                if attr.startswith('data-'):
                    element_data['data_attrs'][attr] = value
            
            if element_data['data_attrs'] or element_data['text']:
                hidden_data.append(element_data)
    
    # Cerca elementi con attributi specifici di Airbnb
    airbnb_elements = soup.find_all(attrs={
        'data-testid': True,
        'data-test': True,
        'data-cy': True,
        'data-qa': True,
        'data-automation': True
    })
    
    for element in airbnb_elements:
        element_data = {
            'tag': element.name,
            'text': element.get_text(strip=True),
            'test_attrs': {},
            'all_attrs': dict(element.attrs)
        }
        
        # Estrai attributi di test
        for attr in ['data-testid', 'data-test', 'data-cy', 'data-qa', 'data-automation']:
            if element.get(attr):
                element_data['test_attrs'][attr] = element.get(attr)
        
        if element_data['test_attrs'] or element_data['text']:
            hidden_data.append(element_data)
    
    # Cerca elementi con classi specifiche che potrebbero contenere dati
    class_patterns = [
        'listing', 'property', 'room', 'pdp', 'details', 'description',
        'amenities', 'reviews', 'host', 'location', 'pricing', 'availability'
    ]
    
    for pattern in class_patterns:
        elements = soup.find_all(class_=re.compile(pattern, re.I))
        for element in elements:
            element_data = {
                'tag': element.name,
                'text': element.get_text(strip=True),
                'classes': element.get('class', []),
                'all_attrs': dict(element.attrs)
            }
            
            if element_data['text']:
                hidden_data.append(element_data)
    
    return hidden_data

def extract_with_playwright(url, click_buttons=True):
    """Estrae tutto il contenuto usando Playwright per contenuto dinamico"""
    print("=== ESTRAZIONE CON PLAYWRIGHT ===")
    
    with sync_playwright() as p:
        # Avvia browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        try:
            print(f"Visitando URL con Playwright: {url}")
            page.goto(url, wait_until='domcontentloaded', timeout=15000)
            
            # Attendi che la pagina si carichi completamente
            print("Attendo caricamento completo della pagina...")
            page.wait_for_timeout(3000)
            
            # Scroll veloce per caricare contenuto lazy-loaded
            print("Scrolling per caricare contenuto dinamico...")
            try:
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1000)
                page.evaluate("window.scrollTo(0, 0)")
                page.wait_for_timeout(1000)
            except Exception as e:
                print(f"Errore durante scroll: {e}")
            
            # Attendi ulteriori caricamenti
            page.wait_for_timeout(2000)
            
            # Cerca e clicca su "Mostra di più" se presente (veloce)
            if click_buttons:
                print("Cerco pulsanti 'Mostra di più'...")
                try:
                    # Cerca solo i primi 20 pulsanti per velocità
                    show_more_buttons = page.query_selector_all("button")[:20]
                    for button in show_more_buttons:
                        try:
                            text = button.inner_text().lower()
                            if 'mostra' in text or 'show' in text or 'più' in text or 'more' in text:
                                if button.is_visible():
                                    print(f"Trovato pulsante: {text[:30]}...")
                                    button.click()
                                    page.wait_for_timeout(500)  # Ridotto da 1000 a 500ms
                        except:
                            continue
                except Exception as e:
                    print(f"Errore durante ricerca pulsanti: {e}")
            else:
                print("Salto click sui pulsanti per velocità...")
            
            # Estrai HTML completo dopo tutti i caricamenti
            html_content = page.content()
            print(f"HTML estratto con Playwright: {len(html_content)} caratteri")
            
            # Estrai tutto il testo visibile
            all_text = page.evaluate("""
                () => {
                    // Rimuovi script e style
                    const scripts = document.querySelectorAll('script, style, noscript');
                    scripts.forEach(el => el.remove());
                    
                    // Ottieni tutto il testo
                    return document.body.innerText || document.body.textContent || '';
                }
            """)
            
            print(f"Testo estratto con Playwright: {len(all_text)} caratteri")
            
            # Estrai anche dati JSON dal DOM
            json_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Cerca variabili globali
                    if (window.__INITIAL_STATE__) data.__INITIAL_STATE__ = window.__INITIAL_STATE__;
                    if (window.__APOLLO_STATE__) data.__APOLLO_STATE__ = window.__APOLLO_STATE__;
                    if (window.__NEXT_DATA__) data.__NEXT_DATA__ = window.__NEXT_DATA__;
                    if (window.__INITIAL_PROPS__) data.__INITIAL_PROPS__ = window.__INITIAL_PROPS__;
                    if (window.__BOOTSTRAP__) data.__BOOTSTRAP__ = window.__BOOTSTRAP__;
                    if (window.__REDUX_STATE__) data.__REDUX_STATE__ = window.__REDUX_STATE__;
                    if (window.__DATA__) data.__DATA__ = window.__DATA__;
                    if (window.__CONFIG__) data.__CONFIG__ = window.__CONFIG__;
                    if (window.__ROOM_DATA__) data.__ROOM_DATA__ = window.__ROOM_DATA__;
                    if (window.__PROPERTY_DATA__) data.__PROPERTY_DATA__ = window.__PROPERTY_DATA__;
                    if (window.__LISTING_DATA__) data.__LISTING_DATA__ = window.__LISTING_DATA__;
                    if (window.__AIRBNB_DATA__) data.__AIRBNB_DATA__ = window.__AIRBNB_DATA__;
                    
                    // Cerca anche in window con Symbol
                    if (window[Symbol.for("__global cache key __")]) {
                        data.global_cache = window[Symbol.for("__global cache key __")];
                    }
                    
                    return data;
                }
            """)
            
            # Estrai anche tutti gli attributi data-*
            data_attributes = page.evaluate("""
                () => {
                    const elements = document.querySelectorAll('*');
                    const data = [];
                    
                    elements.forEach((el, index) => {
                        const attrs = {};
                        for (let attr of el.attributes) {
                            if (attr.name.startsWith('data-')) {
                                attrs[attr.name] = attr.value;
                            }
                        }
                        
                        if (Object.keys(attrs).length > 0) {
                            data.push({
                                tag: el.tagName,
                                text: el.innerText || el.textContent || '',
                                data_attrs: attrs,
                                classes: Array.from(el.classList)
                            });
                        }
                    });
                    
                    return data;
                }
            """)
            
            return {
                'html_content': html_content,
                'text_content': all_text,
                'json_data': json_data,
                'data_attributes': data_attributes,
                'success': True
            }
            
        except Exception as e:
            print(f"Errore con Playwright: {e}")
            return {
                'html_content': '',
                'text_content': '',
                'json_data': {},
                'data_attributes': [],
                'success': False,
                'error': str(e)
            }
        
        finally:
            browser.close()

def make_api_requests(session, api_calls, base_url):
    """Fa richieste alle API trovate"""
    print("=== RICHIESTE API ===")
    api_responses = []
    
    for api_url in api_calls[:10]:  # Limita a 10 per evitare troppe richieste
        try:
            # Converti URL relativo in assoluto
            if api_url.startswith('/'):
                api_url = urljoin(base_url, api_url)
            elif not api_url.startswith('http'):
                api_url = urljoin(base_url, '/' + api_url)
            
            print(f"Tentativo richiesta a: {api_url}")
            
            response = session.get(api_url, timeout=10)
            
            api_responses.append({
                'url': api_url,
                'status_code': response.status_code,
                'content_type': response.headers.get('content-type', ''),
                'content': response.text[:5000] if response.text else '',  # Limita dimensione
                'headers': dict(response.headers)
            })
            
            print(f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type', 'N/A')}")
            
        except Exception as e:
            print(f"Errore richiesta API {api_url}: {e}")
            api_responses.append({
                'url': api_url,
                'error': str(e)
            })
    
    return api_responses

def extract_all_content(url):
    """Estrae tutto il contenuto possibile dalla pagina"""
    print(f"=== ESTRAZIONE CONTENUTO DA: {url} ===")
    
    # Prima prova con Playwright per contenuto dinamico
    print("\n🔄 Tentativo con Playwright per contenuto dinamico...")
    playwright_result = extract_with_playwright(url, click_buttons=True)
    
    if playwright_result['success']:
        print("✅ Playwright ha estratto contenuto con successo!")
        
        # Salva i risultati di Playwright
        with open('airbnb_playwright_output.html', 'w', encoding='utf-8') as f:
            f.write(playwright_result['html_content'])
        
        with open('airbnb_playwright_text.txt', 'w', encoding='utf-8') as f:
            f.write(playwright_result['text_content'])
        
        with open('airbnb_playwright_json.json', 'w', encoding='utf-8') as f:
            json.dump(playwright_result['json_data'], f, ensure_ascii=False, indent=2, default=str)
        
        with open('airbnb_playwright_data_attrs.json', 'w', encoding='utf-8') as f:
            json.dump(playwright_result['data_attributes'], f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n=== RISULTATI PLAYWRIGHT ===")
        print(f"HTML: {len(playwright_result['html_content'])} caratteri")
        print(f"Testo: {len(playwright_result['text_content'])} caratteri")
        print(f"Dati JSON: {len(playwright_result['json_data'])} chiavi")
        print(f"Attributi data-*: {len(playwright_result['data_attributes'])} elementi")
        
        return {
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'method': 'playwright',
            'success': True,
            'html_content': playwright_result['html_content'],
            'text_content': playwright_result['text_content'],
            'json_data': playwright_result['json_data'],
            'data_attributes': playwright_result['data_attributes']
        }
    
    else:
        print("❌ Playwright fallito, provo con requests...")
        return extract_with_requests_fallback(url)

def extract_with_requests_fallback(url):
    """Fallback con requests se Playwright fallisce"""
    print("=== FALLBACK CON REQUESTS ===")
    
    session = create_session()
    all_data = {
        'url': url,
        'timestamp': datetime.now().isoformat(),
        'method': 'requests',
        'html_content': '',
        'text_content': '',
        'json_data': [],
        'api_calls': [],
        'api_responses': [],
        'meta_tags': [],
        'scripts': [],
        'links': [],
        'images': [],
        'forms': [],
        'hidden_data': []
    }
    
    try:
        # Prima richiesta
        print("Faccio prima richiesta...")
        response = session.get(url, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Content Length: {len(response.text)}")
        print(f"Content Type: {response.headers.get('content-type', 'N/A')}")
        
        # Gestisci compressione
        if response.headers.get('content-encoding') == 'gzip':
            try:
                html_content = gzip.decompress(response.content).decode('utf-8')
            except:
                # Se la decompressione fallisce, usa il testo normale
                html_content = response.text
        else:
            html_content = response.text
        
        all_data['html_content'] = html_content
        
        # Salva HTML completo
        with open('airbnb_requests_output.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        # Parsing con BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Estrai tutto il testo
        all_text = soup.get_text()
        all_data['text_content'] = all_text
        
        with open('airbnb_requests_text.txt', 'w', encoding='utf-8') as f:
            f.write(all_text)
        
        print(f"Testo estratto: {len(all_text)} caratteri")
        
        # Estrai meta tags
        print("Estraggo meta tags...")
        meta_tags = []
        for meta in soup.find_all('meta'):
            meta_tags.append({
                'name': meta.get('name', ''),
                'property': meta.get('property', ''),
                'content': meta.get('content', ''),
                'http_equiv': meta.get('http-equiv', ''),
                'full_tag': str(meta)
            })
        all_data['meta_tags'] = meta_tags
        
        # Estrai script
        print("Estraggo script...")
        scripts = []
        for i, script in enumerate(soup.find_all('script')):
            scripts.append({
                'index': i,
                'src': script.get('src', ''),
                'type': script.get('type', ''),
                'content': script.string if script.string else '',
                'full_tag': str(script)
            })
        all_data['scripts'] = scripts
        
        # Estrai link
        print("Estraggo link...")
        links = []
        for link in soup.find_all('a', href=True):
            links.append({
                'text': link.get_text(strip=True),
                'href': link['href'],
                'title': link.get('title', ''),
                'class': link.get('class', [])
            })
        all_data['links'] = links
        
        # Estrai immagini
        print("Estraggo immagini...")
        images = []
        for img in soup.find_all('img'):
            images.append({
                'src': img.get('src', ''),
                'alt': img.get('alt', ''),
                'title': img.get('title', ''),
                'class': img.get('class', []),
                'data_src': img.get('data-src', ''),
                'data_lazy': img.get('data-lazy', '')
            })
        all_data['images'] = images
        
        # Estrai form
        print("Estraggo form...")
        forms = []
        for form in soup.find_all('form'):
            form_data = {
                'action': form.get('action', ''),
                'method': form.get('method', ''),
                'class': form.get('class', []),
                'inputs': []
            }
            
            for input_tag in form.find_all(['input', 'select', 'textarea']):
                form_data['inputs'].append({
                    'tag': input_tag.name,
                    'type': input_tag.get('type', ''),
                    'name': input_tag.get('name', ''),
                    'value': input_tag.get('value', ''),
                    'placeholder': input_tag.get('placeholder', ''),
                    'class': input_tag.get('class', [])
                })
            
            forms.append(form_data)
        all_data['forms'] = forms
        
        # Estrai dati JSON
        json_data = extract_json_data(html_content)
        all_data['json_data'] = json_data
        
        # Estrai dati nascosti
        hidden_data = extract_hidden_data(html_content)
        all_data['hidden_data'] = hidden_data
        
        # Estrai API calls
        api_calls = extract_api_calls(html_content)
        all_data['api_calls'] = api_calls
        
        # Fai richieste alle API
        if api_calls:
            api_responses = make_api_requests(session, api_calls, url)
            all_data['api_responses'] = api_responses
        
        # Salva tutto in JSON
        with open('airbnb_requests_data.json', 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n=== RIEPILOGO ESTRAZIONE REQUESTS ===")
        print(f"HTML: {len(html_content)} caratteri")
        print(f"Testo: {len(all_text)} caratteri")
        print(f"Meta tags: {len(meta_tags)}")
        print(f"Script: {len(scripts)}")
        print(f"Link: {len(links)}")
        print(f"Immagini: {len(images)}")
        print(f"Form: {len(forms)}")
        print(f"Dati JSON: {len(json_data)}")
        print(f"Dati nascosti: {len(hidden_data)}")
        print(f"API calls: {len(api_calls)}")
        print(f"API responses: {len(all_data['api_responses'])}")
        
        return all_data
        
    except Exception as e:
        print(f"Errore durante estrazione requests: {e}")
        return None

def main():
    """Funzione principale"""
    url = "https://www.airbnb.it/rooms/14207293?check_in=2025-09-13&check_out=2025-09-14&photo_id=205741887&source_impression_id=p3_1757768982_P3soD8xK6u5w9yiF&previous_page_section_name=1000"
    
    print(f"=== ESTRAZIONE DATI AIRBNB CON PLAYWRIGHT (OTTIMIZZATA) ===")
    print(f"URL: {url}")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 60)
    
    # Prova prima versione veloce senza click
    print("\n🚀 Tentativo VELOCE senza click sui pulsanti...")
    start_time = time.time()
    playwright_result_fast = extract_with_playwright(url, click_buttons=False)
    fast_time = time.time() - start_time
    
    if playwright_result_fast['success']:
        print(f"✅ Estrazione VELOCE completata in {fast_time:.1f} secondi!")
        
        # Salva risultati veloci
        with open('airbnb_playwright_fast_output.html', 'w', encoding='utf-8') as f:
            f.write(playwright_result_fast['html_content'])
        
        with open('airbnb_playwright_fast_text.txt', 'w', encoding='utf-8') as f:
            f.write(playwright_result_fast['text_content'])
        
        print(f"HTML veloce: {len(playwright_result_fast['html_content'])} caratteri")
        print(f"Testo veloce: {len(playwright_result_fast['text_content'])} caratteri")
        
        # Ora prova versione completa
        print(f"\n🔄 Tentativo COMPLETO con click sui pulsanti...")
        start_time = time.time()
        result = extract_all_content(url)
        complete_time = time.time() - start_time
        
        print(f"\n=== CONFRONTO TEMPI ===")
        print(f"Versione veloce: {fast_time:.1f} secondi")
        print(f"Versione completa: {complete_time:.1f} secondi")
        print(f"Differenza: {complete_time - fast_time:.1f} secondi")
    else:
        print("❌ Estrazione veloce fallita, provo versione completa...")
        result = extract_all_content(url)
    
    if result and result.get('success'):
        print(f"\n✅ Estrazione completata con successo usando {result.get('method', 'unknown')}!")
        
        if result.get('method') == 'playwright':
            print(f"\n=== FILE GENERATI CON PLAYWRIGHT ===")
            print("- airbnb_playwright_output.html (HTML completo)")
            print("- airbnb_playwright_text.txt (Testo completo)")
            print("- airbnb_playwright_json.json (Dati JSON dal DOM)")
            print("- airbnb_playwright_data_attrs.json (Attributi data-*)")
        else:
            print(f"\n=== FILE GENERATI CON REQUESTS ===")
            print("- airbnb_requests_output.html (HTML completo)")
            print("- airbnb_requests_text.txt (Testo completo)")
            print("- airbnb_requests_data.json (Tutti i dati)")
    else:
        print("\n❌ Estrazione fallita!")

if __name__ == "__main__":
    main()
