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

    // 会在 obj 上添加新属性，或者修改现有属性
    // 所以是个引用变量
    Object.defineProperty(obj, key, {
      get() {
        return val
      },
      set(newVal) {
        if (newVal !== val) {
          val = newVal
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
