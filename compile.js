class Compile {
  constructor(vm) {
    // new Watcher 需要 vm
    this.$vm = vm
    this.$el = document.querySelector(this.$vm.$options.el)

    if (this.$el) {
      // 提取宿主中模板内容到 fragment 标签（结束后 $el 中没有子元素）
      // 不会引起页面回流（对元素位置和几何上的计算），性能更好
      this.$fragment = this.node2Fragment(this.$el)
      // 编译，并进行依赖收集
      this.compile(this.$fragment)
      // 编译结束后把 fragment 再添加到 el 中
      this.$el.appendChild(this.$fragment)
    }
  }

  node2Fragment(el) {
    const fragment = document.createDocumentFragment()
    let child
    while ((child = el.firstChild)) {
      fragment.appendChild(child)
    }
    return fragment
  }

  compile(el) {
    const childNodes = el.childNodes

    Array.from(childNodes).forEach((node) => {
      // 判断节点类型
      if (node.nodeType === 1) {
        // Element 节点
        console.log('遍历到节点', node.nodeName)
        this.compileElement(node)
      } else if (this.isInterpolation(node)) {
        // 插值表达式
        console.log('遍历到插值表达式', node.textContent)
        this.compileText(node)
      }
      // 如果有子节点
      if (node.children && node.childNodes.length > 0) {
        this.compile(node)
      }
    })
  }

  isInterpolation(node) {
    // 是文本且符合{{...}}
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }

  compileText(node) {
    // console.log(RegExp.$1)
    const exp = RegExp.$1
    this.update(this.$vm, node, exp, 'text')
  }

  update(vm, node, exp, dir) {
    const updater = this[dir + 'Updater']
    // 也可以把 updater 的实现直接放在 watcher 里面
    // 就不用形成闭包，但是这样 watcher 就太臃肿了。
    updater && updater(node, exp)
    // 注意 this
    const get = this.getContent
    // 形成闭包，和一个 Watcher 实例对应
    new Watcher(
      // vm, // 在这里处理
      // exp, // 在这里处理
      function() {
        get(exp)
      },
      function() {
        updater && updater(node, exp)
      },
    )
  }

  // 注意 this
  textUpdater = (node, exp) => {
    node.textContent = this.getContent(exp)
  }
  htmlUpdater = (node, exp) => {
    node.innerHTML = this.getContent(exp)
  }
  modelUpdater = (node, exp) => {
    node.value = this.getContent(exp)
  }

  // 注意 this
  getContent = (exp) => {
    // 解决嵌套，get 嵌套属性的值
    const p = exp.split('.')
    let content = this.$vm[p[0]]
    for (let i = 1; i < p.length; i++) {
      content = content[p[i]]
    }
    return content
  }
  setContent = (exp, value) => {
    const p = exp.split('.')
    if (p.length === 1) {
      this.$vm[p] = value
    } else if (p.length > 1) {
      let content = this.$vm[p[0]]
      for (let i = 1; i < p.length - 1; i++) {
        content = content[p[i]]
      }
      content[p[p.length - 1]] = value
    }
  }

  compileElement(node) {
    const nodeAttrs = node.attributes
    Array.from(nodeAttrs).forEach((attr) => {
      const attrName = attr.name
      const exp = attr.value
      if (attrName.indexOf('v-') === 0) {
        const dir = attrName.substring(2)
        this[dir] && this[dir](this.$vm, node, exp)
      } else if (attrName.indexOf('@') === 0) {
        // @click="handleClick"
        const dir = attrName.substring(1)
        this.eventHandler(this.$vm, node, exp, dir)
      }
    })
  }

  text(vm, node, exp) {
    this.update(vm, node, exp, 'text')
  }

  html(vm, node, exp) {
    this.update(vm, node, exp, 'html')
  }

  model(vm, node, exp) {
    this.update(vm, node, exp, 'model')
    node.addEventListener('input', (e) => {
      this.setContent(exp, e.target.value)
    })
  }

  eventHandler(vm, node, exp, dir) {
    const fn = vm.$options.methods && vm.$options.methods[exp]
    // console.log(node, exp, dir, fn)
    if (dir && fn) {
      // 注意 this
      node.addEventListener(dir, fn.bind(vm))
    }
  }
}
