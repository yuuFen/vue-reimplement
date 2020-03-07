class Vue {
  constructor(options) {
    this.$options = options

    this.$data = options.data

    // 响应化处理
    this.observe(this.$data)

    Object.keys(this.$data).forEach((key) => {
      // 只需要给 data 的第一层设置代理
      // 不然 set 多余的键时会给 data 添加属性
      this.proxyData(key)
    })

    // new Watcher(this, 'foo')
    // new Watcher(this, 'bar.doo')

    new Compile(this, options.el)
  }

  observe(value) {
    if (!value || typeof value !== 'object') {
      return
    }

    Object.keys(value).forEach((key) => {
      // setter 和 getter 使用中介 val，防止无限循环
      // 需要新建一个作用域（闭包）来保存 val,
      // Object.defineProperty(obj, key, { // val })
      this.defineReactive(value, key, value[key])
    })
  }

  defineReactive(obj, key, val) {
    // 递归，处理对象
    this.observe(val)

    //
    const dep = new Dep()

    // 会在 obj 上添加新属性，或者修改现有属性
    // 所以是个引用变量
    Object.defineProperty(obj, key, {
      get() {
        // 若存在 targetWatcher（watcher的构造阶段），则添加
        Dep.targetWatcher && dep.addWatcher(Dep.targetWatcher)
        return val
      },
      set(newVal) {
        if (newVal !== val) {
          val = newVal
          // 通知更新
          dep.notify()
        }
      },
    })
  }

  // 在 Vue 实例根上定义属性转发至 data 中的数据
  proxyData(key) {
    // this 指 Vue 实例
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key]
      },
      set(newVal) {
        this.$data[key] = newVal
      },
    })
  }
}

// 创建 Dep: 管理所有的 Watcher
class Dep {
  constructor() {
    this.watchers = []
  }
  addWatcher(watcher) {
    this.watchers.push(watcher)
  }
  notify() {
    this.watchers.forEach((watcher) => {
      watcher.update()
    })
  }
}

// 创建 Watcher：与视图中的变量对应(出现一次就创建一个 Watcher 实例)
class Watcher {
  constructor(vm, get, cb) {
    this.vm = vm
    // this.key = key
    this.cb = cb

    this.get = get // 获取嵌套属性的方法

    Dep.targetWatcher = this
    // key解析出来之后为字符串， 但是若如 'bar.doo'，需要额外操作
    // 访问 bar.doo，会将它同时挂载到 bar 和 doo 的 Dep 实例（也是有必要的）
    // 这里直接在闭包中处理
    this.get()
    Dep.targetWatcher = null
  }
  update() {
    // 需要 node
    console.log(this.key, '更新——来自 watcher')
    // 更新视图
    this.cb()
  }
}
