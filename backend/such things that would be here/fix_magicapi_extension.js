const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '../server.js');
let code = fs.readFileSync(target, 'utf8');

const oldFunc = `async function getFileUrl(ctx, fileId, localPath) {
  try {
    // ALWAYS use the direct Telegram link. 
    // MagicAPI needs a public URL. Telegram file links are public (with token) and valid for 1h.
    const link = await ctx.telegram.getFileLink(fileId);
    console.log('Using Telegram Link:', link.href);
    return link.href;
  } catch (e) {
    console.error('Failed to get telegram file link', e);
    return null;
  }
}`;

const newFunc = `async function getFileUrl(ctx, fileId, localPath) {
  try {
    // ALWAYS use the direct Telegram link. 
    // MagicAPI needs a public URL. Telegram file links are public (with token) and valid for 1h.
    const link = await ctx.telegram.getFileLink(fileId);
    let url = link.href;
    console.log('Using Telegram Link:', url);

    // MagicAPI requires a valid extension (jpg, jpeg, png, webp).
    // If the Telegram URL doesn't have one, append it from localPath using a hash fragment.
    try {
        const urlObj = new URL(url);
        const ext = path.extname(urlObj.pathname);
        if (!ext || ext.length < 2) {
            const localExt = path.extname(localPath);
            if (localExt) {
                console.log(\`Appending extension \${localExt} to URL as fragment\`);
                url += \`#image\${localExt}\`; 
            }
        }
    } catch (e) { console.error('URL parse error', e); }

    return url;
  } catch (e) {
    console.error('Failed to get telegram file link', e);
    return null;
  }
}`;

if (code.includes('async function getFileUrl(ctx, fileId, localPath)')) {
    // We need to be careful with replace if the spacing is slightly different.
    // Let's try to match the body.
    
    // Easier: Use a regex to replace the whole function if possible, or just the inner part.
    // The previous implementation was:
    // const link = await ctx.telegram.getFileLink(fileId);
    // console.log('Using Telegram Link:', link.href);
    // return link.href;
    
    const innerOld = `    const link = await ctx.telegram.getFileLink(fileId);
    console.log('Using Telegram Link:', link.href);
    return link.href;`;
    
    const innerNew = `    const link = await ctx.telegram.getFileLink(fileId);
    let url = link.href;
    console.log('Using Telegram Link:', url);

    // MagicAPI requires a valid extension. Append as hash if missing.
    try {
        const urlObj = new URL(url);
        const ext = path.extname(urlObj.pathname);
        if (!ext || ext.length < 2) {
            const localExt = path.extname(localPath);
            if (localExt) {
                console.log(\`Appending extension \${localExt} to URL as fragment\`);
                url += \`#image\${localExt}\`; 
            }
        }
    } catch (e) { console.error('URL parse error', e); }

    return url;`;

    // Normalize line endings for comparison
    const norm = (s) => s.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    
    if (norm(code).includes(norm(innerOld))) {
       code = code.replace(innerOld, innerNew); // This might fail if exact whitespace differs
       // Let's use a more robust replacement manually if needed, or just overwrite the file if we are confident.
       // Since I read the file content recently, I can just replace the specific lines.
    } else {
        // Fallback: Regex replace
        code = code.replace(
            /const link = await ctx\.telegram\.getFileLink\(fileId\);\s*console\.log\('Using Telegram Link:', link\.href\);\s*return link\.href;/,
            innerNew
        );
    }
    
    fs.writeFileSync(target, code);
    console.log('server.js patched with extension fix');
} else {
    console.error('Could not find getFileUrl function in server.js');
}
