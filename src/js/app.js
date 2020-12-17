const data = {
    posts: [
        {
            "path": "post.html#post/include.md",
            "title": "Include",
            "author": "Chet",
            "date": 20201128,
            "tags": ["portfolio"],
            "image": "post/include.header.gif",
            "summary": "Include is javascript lib which can include a html in a html."
        },
        {
            "path": "post.html#post/encryption_and_decryption.md",
            "title": "Encryption and decryption",
            "author": "Chet",
            "date": 20201128,
            "tags": ["portfolio"],
            "image": "post/encryption_and_decryption.header.png",
            "summary": "What are the principles of encryption and decryption? There are most two common way of encryption and decryption"
        },
        {
            "path": "post.html#post/html_and_css.md",
            "title": "Html and css",
            "author": "Chet",
            "date": 20201128,
            "image": "post/html_and_css.header.png",
            "summary": "Hypertext Markup Language (HTML) is the standard markup language for documents designed to be displayed in a web browser. "
        },
        {
            "path": "post.html#post/minecraft_guide.md",
            "title": "Minecraft guide",
            "author": "Chet",
            "date": 20201128,
            "tags": ["portfolio"],
            "image": "post/minecraft_guide.header.png",
            "summary": "In Minecraft, players explore a blocky, procedurally-generated 3D world with infinite terrain, and may discover and extract raw materials..."
        },
        {
            "path": "post.html#post/about_me.md",
            "title": "About Me",
            "author": "Chet",
            "date": 20201128,
            "image": "post/about_me.hill.JPG",
            "summary": "Bytes are the only thing you will leave in this world, not bone ashes."
        },
        {
            "path": "post.html#post/OOP.md",
            "title": "OOP",
            "author": "Chet",
            "date": 20201128,
            "tags": ["portfolio"],
            "image": "post/OOP.header.jpg",
            "summary": "What's the object-oriented programming?  Dividing and isolating the complexity of the problem."
        },
        {
            "path": "post.html#post/SSL.md",
            "title": "SSL",
            "author": "Chet",
            "date": 20201128,
            "image": "post/SSL.header.jpeg",
            "summary": "SSL and TLS are protocols for establishing authenticated and encrypted links between networked computers."
        }
    ]
}

window.addEventListener('hashchange', function () {
    if (location.hash != "#") {
        location.reload()
    }
}, false);

document.addEventListener('DOMContentLoaded', (event) => {

        Array.from(document.querySelectorAll(".menu a")).forEach(function (a) {
            if (document.URL === a.href) {
                a.classList.add("underline")
            } else {
                a.classList.remove("underline")
            }
        })

        // render portfolio
        const container = document.querySelector('.container');
        if(container!==null){
            const posts = data.posts.filter(function (post) {
                if (post['tags'] && post['tags'].find(tag => {
                    return tag === "portfolio"
                })) {
                    return true;
                }
            })
            const rendered = Mustache.render(container.innerHTML, {posts: posts});
            container.innerHTML = rendered;
        }

        //render post
        const mdPath = location.hash.substring(location.hash.lastIndexOf("#")+1)
        const template_post = document.getElementById('template_post');
        if(template_post!=null){
            const rendered = Mustache.render(template_post.innerHTML, {posts:data.posts.filter(v => { return v.path.endsWith(location.hash)}) });
            document.getElementById('postHeader').outerHTML = rendered
            fetch(mdPath).then(res => {return res.text()}).then(text =>{
                document.getElementById('target_post').innerHTML = marked(text);
            })
        }

        //render post list
        const template_postList = document.getElementById('template_postList');
        if(template_postList!=null){
            document.getElementById('target_postList').outerHTML = Mustache.render(template_postList.innerHTML, data);
        }

});


