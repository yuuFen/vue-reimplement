class Compile {
  constructor(vm, el) {
    // new Watcher 需要 vm
    this.$vm = vm
    this.$el = document.querySelector(el)

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
      } else if (this.isInterpolation(node)) {
        // 插值表达式
        console.log('遍历到插值表达式', node.textContent)
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
}