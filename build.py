import sys, re
DS = sys.argv[1] if len(sys.argv) > 1 else 'design-system'
tokens = open(DS + '/tokens.css').read()
bcss = open(DS + '/components/bundle.css').read()
bcss = re.sub(r'^@import url\([^)]*\);\s*', '', bcss)
bjs = open(DS + '/components/bundle.js').read()
page = open('src/page.css').read()
app = open('src/app.js').read()
out = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>DAJU Matcha</title>
<meta name="description" content="DAJU Matcha, a pop-up matcha bar in Kota Kinabalu. Build your cup and order on WhatsApp.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DAJU">
<meta property="og:title" content="DAJU Matcha">
<meta property="og:description" content="Pop-up matcha bar in Kota Kinabalu. Build your cup and order on WhatsApp.">
<meta property="og:image" content="og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="DAJU logo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="og-image.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Courier+Prime:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Permanent+Marker&family=Sacramento&family=Shrikhand&display=swap">
<style>
{tokens}
{bcss}
{page}
</style>
</head>
<body>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js"></script>
<script>
{bjs}
</script>
<script>
{app}
</script>
</body>
</html>
'''
open('index.html', 'w').write(out)
print(len(out))
