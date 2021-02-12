<script>
import BaseInput from "./BaseInput";

export default {
  mixins: [BaseInput],
  name: "date-input",
  methods: {  
    onInput(evt) {
        this.$emit('input', evt)
      }   
  }
}

</script>
